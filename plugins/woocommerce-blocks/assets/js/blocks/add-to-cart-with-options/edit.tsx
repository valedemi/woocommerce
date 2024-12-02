/**
 * External dependencies
 */
import { useEffect } from '@wordpress/element';
import { InnerBlocks, useBlockProps } from '@wordpress/block-editor';
import { BlockEditProps } from '@wordpress/blocks';
import type { InnerBlockTemplate } from '@wordpress/blocks';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useIsDescendentOfSingleProductBlock } from '../../atomic/blocks/product-elements/shared/use-is-descendent-of-single-product-block';
import { useIsDescendentOfSingleProductTemplate } from '../../atomic/blocks/product-elements/shared/use-is-descendent-of-single-product-template';
import { AddToCartOptionsSettings } from './settings';
export interface Attributes {
	className?: string;
	isDescendentOfSingleProductBlock: boolean;
	isDescendentOfSingleProductTemplate: boolean;
}

export type FeaturesKeys = 'isBlockifiedAddToCart';

export type FeaturesProps = {
	[ key in FeaturesKeys ]?: boolean;
};

export type UpdateFeaturesType = ( key: FeaturesKeys, value: boolean ) => void;

const AddToCartOptionsEdit = ( props: BlockEditProps< Attributes > ) => {
	const { setAttributes } = props;

	const blockProps = useBlockProps();
	const { isDescendentOfSingleProductBlock } =
		useIsDescendentOfSingleProductBlock( {
			blockClientId: blockProps?.id,
		} );
	const { isDescendentOfSingleProductTemplate } =
		useIsDescendentOfSingleProductTemplate();

	const INNER_BLOCKS_TEMPLATE: InnerBlockTemplate[] = [
		[
			'core/heading',
			{
				level: 2,
				content: __( 'Add to Cart', 'woocommerce' ),
			},
		],
		[
			'woocommerce/product-stock-indicator',
			{
				isDescendentOfSingleProductTemplate,
			},
		],
		[
			'woocommerce/product-button',
			{
				textAlign: 'center',
				fontSize: 'small',
			},
		],
	];

	useEffect( () => {
		setAttributes( {
			isDescendentOfSingleProductBlock,
			isDescendentOfSingleProductTemplate,
		} );
	}, [
		setAttributes,
		isDescendentOfSingleProductBlock,
		isDescendentOfSingleProductTemplate,
	] );

	return (
		<>
			<AddToCartOptionsSettings
				features={ {
					isBlockifiedAddToCart: true,
				} }
			/>
			<div { ...blockProps }>
				<InnerBlocks template={ INNER_BLOCKS_TEMPLATE } />
			</div>
		</>
	);
};

export default AddToCartOptionsEdit;
