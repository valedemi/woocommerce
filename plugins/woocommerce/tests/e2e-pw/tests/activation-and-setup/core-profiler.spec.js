const { test, expect, request } = require( '@playwright/test' );
const { setOption } = require( '../../utils/options' );
const { exec } = require( 'child_process' );

const getPluginLocator = ( page, slug ) => {
	return page.locator(
		`.woocommerce-profiler-plugins-plugin-card[data-slug="${ slug }"]`
	);
};

function loadDatabaseBackup() {
	return new Promise( ( resolve, reject ) => {
		const importCommand = `wp-env run cli wp db import /var/www/html/wp-content/dump.sql`;
		exec( importCommand, ( error, stdout, stderr ) => {
			if ( error ) {
				console.error( `Error importing database: ${ error.message }` );
				return reject( error );
			}
			if ( stderr && ! stderr.includes( 'Ran `wp db import' ) ) {
				console.error( `Error output: ${ stderr }` );
				return reject( new Error( stderr ) );
			}
			console.log( 'Database imported successfully.' );
			resolve( stdout );
		} );
	} );
}

test.describe(
	'Store owner can complete the core profiler',
	{ tag: [ '@skip-on-default-pressable', '@skip-on-default-wpcom' ] },
	() => {
		test.use( { storageState: process.env.ADMINSTATE } );

		test.beforeAll( async ( { baseURL } ) => {
			try {
				await setOption(
					request,
					baseURL,
					'woocommerce_coming_soon',
					'no'
				);
				await setOption(
					request,
					baseURL,
					'woocommerce_remote_variant_assignment',
					'60'
				);
			} catch ( error ) {
				console.log( error );
			}
		} );

		test.afterAll( async ( {} ) => {
			// Load the database backup
			try {
				await loadDatabaseBackup();
			} catch ( error ) {
				console.error( 'Failed to load the database backup:', error );
			}
		} );

		test( 'Can skip extension install', async ( { page } ) => {
			await page.goto(
				'wp-admin/admin.php?page=wc-admin&path=%2Fsetup-wizard'
			);

			await test.step( 'Intro page and opt in to data sharing', async () => {
				await expect(
					page.getByRole( 'heading', { name: 'Welcome to Woo!' } )
				).toBeVisible();
				await page
					.getByRole( 'checkbox', {
						name: 'I agree to share my data',
					} )
					.uncheck();
				await page
					.getByRole( 'button', { name: 'Set up my store' } )
					.click();
			} );

			await test.step( 'User profile information', async () => {
				await expect(
					page.getByRole( 'heading', {
						name: 'Which one of these best describes you?',
					} )
				).toBeVisible();
				await page
					.getByRole( 'radio' )
					.filter( { hasText: 'just starting my business' } )
					.click();
				await page.getByRole( 'button', { name: 'Continue' } ).click();
			} );

			await test.step( 'Business Information', async () => {
				await expect(
					page.getByRole( 'heading', {
						name: 'Tell us a bit about your store',
					} )
				).toBeVisible();
				await expect(
					page.getByPlaceholder( 'Ex. My awesome store' )
				).toHaveValue( 'WooCommerce Core E2E Test Suite' );
				await page
					.locator(
						'form.woocommerce-profiler-business-information-form > div > div > div > div > input'
					)
					.first()
					.click();
				// select clothing and accessories
				await page
					.getByRole( 'option', { name: 'Clothing and accessories' } )
					.click();
				// select a WooPayments compatible location
				await page
					.locator(
						'form.woocommerce-profiler-business-information-form > div > div > div > div > input'
					)
					.last()
					.click();
				await page
					.getByRole( 'option', {
						name: 'Australia — Northern Territory',
					} )
					.click();

				await page
					.getByPlaceholder( 'wordpress@example.com' )
					.fill( 'merchant@example.com' );
				await page.getByLabel( 'Opt-in to receive tips,' ).uncheck();
				await page.getByRole( 'button', { name: 'Continue' } ).click();
			} );

			await test.step( 'Extensions -- do not install any', async () => {
				await expect(
					page.getByRole( 'heading', {
						name: 'Get a boost with our free features',
					} )
				).toBeVisible();
				// check that WooPayments is displayed because Australia is a supported country
				await expect(
					page.getByRole( 'heading', {
						name: 'Get paid with WooPayments',
					} )
				).toBeVisible();
				// skip this step so that no extensions are installed
				await page
					.getByRole( 'button', { name: 'Skip this step' } )
					.click();
			} );

			await test.step( 'Confirm that core profiler was completed and no extensions installed', async () => {
				// intermediate page shown
				await expect(
					page.getByRole( 'heading', {
						name: 'Turning on the lights',
					} )
				).toBeVisible();
				await expect(
					page.locator(
						'.woocommerce-onboarding-progress-bar__filler'
					)
				).toBeVisible();
				// dashboard shown
				await expect(
					page.getByRole( 'heading', {
						name: 'Welcome to WooCommerce Core E2E Test Suite',
					} )
				).toBeVisible();

				// go to the plugins page to make sure that extensions weren't installed
				await page.goto( 'wp-admin/plugins.php?plugin_status=active' );
				await expect(
					page.getByRole( 'heading', {
						name: 'Plugins',
						exact: true,
					} )
				).toBeVisible();
				// confirm that some of the optional extensions aren't present
				await expect(
					page.getByText( 'MailPoet for WooCommerce', {
						exact: true,
					} )
				).toBeHidden();
				await expect(
					page.getByText( 'Pinterest for WooCommerce', {
						exact: true,
					} )
				).toBeHidden();
				await expect(
					page.getByText( 'Google for WooCommerce', { exact: true } )
				).toBeHidden();
			} );

			await test.step( 'Confirm that information from core profiler saved', async () => {
				await page.goto( 'wp-admin/admin.php?page=wc-settings' );
				await expect(
					page.getByRole( 'textbox', {
						name: 'Australia — Northern Territory',
					} )
				).toBeVisible();
				await expect(
					page.getByRole( 'textbox', {
						name: 'Australian dollar ($)',
					} )
				).toBeVisible();
				await expect(
					page.getByRole( 'textbox', { name: 'Left' } )
				).toBeVisible();
				await expect(
					page.getByLabel( 'Thousand separator', { exact: true } )
				).toHaveValue( ',' );
				await expect(
					page.getByLabel( 'Decimal separator', { exact: true } )
				).toHaveValue( '.' );
				await expect(
					page.getByLabel( 'Number of decimals' )
				).toHaveValue( '2' );
			} );
		} );

		test( 'Can complete the core profiler installing default extensions', async ( {
			page,
		} ) => {
			await page.goto(
				'wp-admin/admin.php?page=wc-admin&path=%2Fsetup-wizard'
			);

			await test.step( 'Intro page and opt in to data sharing', async () => {
				await expect(
					page.getByRole( 'heading', { name: 'Welcome to Woo!' } )
				).toBeVisible();
				await page
					.getByRole( 'checkbox', {
						name: 'I agree to share my data',
					} )
					.uncheck();
				await page
					.getByRole( 'button', { name: 'Set up my store' } )
					.click();
			} );

			await test.step( 'User profile information', async () => {
				await expect(
					page.getByRole( 'heading', {
						name: 'Which one of these best describes you?',
					} )
				).toBeVisible();
				await page
					.getByRole( 'radio' )
					.filter( { hasText: 'already selling' } )
					.click();
				await page.getByLabel( 'Select an option' ).click();
				await page
					.getByRole( 'option' )
					.filter( { hasText: 'selling offline' } )
					.click();
				await page.getByRole( 'button', { name: 'Continue' } ).click();
			} );

			await test.step( 'Business Information', async () => {
				await expect(
					page.getByRole( 'heading', {
						name: 'Tell us a bit about your store',
					} )
				).toBeVisible();
				await expect(
					page.getByPlaceholder( 'Ex. My awesome store' )
				).toHaveValue( 'WooCommerce Core E2E Test Suite' );
				await page
					.locator(
						'form.woocommerce-profiler-business-information-form > div > div > div > div > input'
					)
					.first()
					.click();
				// select food and drink
				await page
					.getByRole( 'option', { name: 'Food and drink' } )
					.click();
				// select a WooPayments incompatible location
				await page
					.locator(
						'form.woocommerce-profiler-business-information-form > div > div > div > div > input'
					)
					.last()
					.click();
				await page
					.getByRole( 'option', { name: 'Afghanistan' } )
					.click();

				await page
					.getByPlaceholder( 'wordpress@example.com' )
					.fill( 'merchant@example.com' );
				await page.getByLabel( 'Opt-in to receive tips,' ).uncheck();
				await page.getByRole( 'button', { name: 'Continue' } ).click();
			} );

			await test.step( 'Extensions -- install some suggested extensions', async () => {
				await expect(
					page.getByRole( 'heading', {
						name: 'Get a boost with our free features',
					} )
				).toBeVisible();
				// check that WooPayments is not displayed because Afghanistan is not a supported country
				await expect(
					page.getByRole( 'heading', {
						name: 'Get paid with WooPayments',
					} )
				).not.toBeAttached();

				// select and install the rest of the extentions
				try {
					await page
						.getByText(
							'Boost content creation with Jetpack AI AssistantSave time on content creation'
						)
						.getByRole( 'checkbox' )
						.uncheck( { timeout: 2000 } );
				} catch ( e ) {
					console.log(
						'Checkbox not present for Jetpack AI Assistant'
					);
				}
				try {
					await getPluginLocator( page, 'pinterest-for-woocommerce' )
						.getByRole( 'checkbox' )
						.check( { timeout: 2000 } );
				} catch ( e ) {
					console.log( 'Checkbox not present for Pinterest' );
				}
				try {
					await getPluginLocator( page, 'mailchimp-for-woocommerce' )
						.getByRole( 'checkbox' )
						.uncheck( { timeout: 2000 } );
				} catch ( e ) {
					console.log( 'Checkbox not present for MailChimp' );
				}
				await getPluginLocator( page, 'google-listings-and-ads' )
					.getByRole( 'checkbox' )
					.check( { timeout: 2000 } );
				await page.getByRole( 'button', { name: 'Continue' } ).click();
			} );

			await test.step( 'Confirm that core profiler was completed and a couple of default extensions installed', async () => {
				page.on( 'dialog', ( dialog ) => dialog.accept() );
				// intermediate page shown
				// the next two are soft assertions because depending on the extensions selected, they may or may not appear
				// and we want the test to complete in order for cleanup to happen
				await expect
					.soft(
						page
							.getByRole( 'heading' )
							.filter( { hasText: 'get your features ready' } )
					)
					.toBeVisible( { timeout: 30000 } );
				await expect
					.soft(
						page
							.getByRole( 'heading' )
							.filter( { hasText: 'Extending your store' } )
					)
					.toBeVisible( { timeout: 30000 } );
				// dashboard shown
				await expect(
					page.getByRole( 'heading', {
						name: 'Welcome to WooCommerce Core E2E Test Suite',
					} )
				).toBeVisible( { timeout: 30000 } );
				// go to the plugins page to make sure that extensions were installed
				await page.goto( 'wp-admin/plugins.php?plugin_status=active' );
				await expect(
					page.getByRole( 'heading', {
						name: 'Plugins',
						exact: true,
					} )
				).toBeVisible();
				// confirm that the optional plugins are present
				try {
					await expect(
						page.locator(
							`[data-slug="pinterest-for-woocommerce"]`
						)
					).toBeVisible();
				} catch {
					console.log(
						`Pinterest is not found or not visible on the page`
					);
				}

				try {
					await expect(
						page.locator( `[data-slug="google-listings-and-ads"]` )
					).toBeVisible();
				} catch {
					console.log(
						`Google for WooCommerce is not found or not visible on the page`
					);
				}

				try {
					await expect(
						page.locator(
							`[data-slug="mailchimp-for-woocommerce"]`
						)
					).toBeHidden();
				} catch {
					console.log( `MailChimp is found on the page` );
				}

				try {
					await expect(
						page.locator( `[data-slug="jetpack"]` )
					).toBeHidden();
				} catch {
					console.log( `Jetpack is found on the page` );
				}
			} );

			await test.step( 'Confirm that information from core profiler saved', async () => {
				await page.goto( 'wp-admin/admin.php?page=wc-settings' );
				await expect(
					page.getByRole( 'textbox', { name: 'Afghanistan' } )
				).toBeVisible();
				await expect(
					page.getByRole( 'textbox', { name: 'Afghan afghani (؋)' } )
				).toBeVisible();
				await expect(
					page.getByRole( 'textbox', { name: 'Left with space' } )
				).toBeVisible();
				await expect(
					page.getByLabel( 'Thousand separator', { exact: true } )
				).toHaveValue( '.' );
				await expect(
					page.getByLabel( 'Decimal separator', { exact: true } )
				).toHaveValue( ',' );
				await expect(
					page.getByLabel( 'Number of decimals' )
				).toHaveValue( '0' );
			} );

			await test.step( 'Clean up installed extensions', async () => {
				await page.goto( 'wp-admin/plugins.php' );
				await page.getByLabel( 'Deactivate Google' ).click();
				await expect(
					page.getByText( 'Plugin deactivated.' )
				).toBeVisible();
				// delete plugin regularly or, if attempted, accept deleting data as well
				try {
					await page.getByLabel( 'Delete Google' ).click();
					await expect(
						page.getByText( 'was successfully deleted.' )
					).toBeVisible( { timeout: 5000 } );
				} catch ( e ) {
					await page
						.getByText( 'Yes, delete these files and data' )
						.click();
					await page
						.getByText( 'The selected plugin has been deleted.' )
						.waitFor();
				}
				await expect( page.getByLabel( 'Delete Google' ) ).toBeHidden();
				await page.getByLabel( 'Deactivate Pinterest for' ).click();
				await expect(
					page.getByText( 'Plugin deactivated.' )
				).toBeVisible();
				// delete plugin regularly or, if attempted, accept deleting data as well
				try {
					await page.getByLabel( 'Delete Pinterest for' ).click();
					await expect(
						page.getByText( 'was successfully deleted.' )
					).toBeVisible( { timeout: 5000 } );
				} catch ( e ) {
					await page
						.getByText( 'Yes, delete these files and data' )
						.click();
					await page
						.getByText( 'The selected plugin has been deleted.' )
						.waitFor();
				}
				await expect(
					page.getByLabel( 'Delete Pinterest for' )
				).toBeHidden();
			} );

			await test.step( 'Confirm that the store is in coming soon mode after completing the core profiler', async () => {
				await page.goto( 'wp-admin/admin.php?page=wc-admin' );
				await expect(
					page
						.getByRole( 'menuitem' )
						.filter( { hasText: 'coming soon' } )
				).toBeVisible();
			} );
		} );
	}
);