/**
 * External dependencies
 */
import { type OfflinePaymentGateway } from '@woocommerce/data';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { OfflinePaymentGatewayList } from '../offline-gateway-list-item/offline-payment-gateway-list-item';
import { ListPlaceholder } from '~/settings-payments/components/list-placeholder';

interface OfflinePaymentGatewaysProps {
	isFetching: boolean;
	offlinePaymentGateways: OfflinePaymentGateway[];
	updateOrdering: ( gateways: OfflinePaymentGateway[] ) => void;
}

export const OfflinePaymentGateways = ( {
	isFetching,
	offlinePaymentGateways,
	updateOrdering,
}: OfflinePaymentGatewaysProps ) => {
	return (
		<div className="settings-payment-gateways">
			<div className="settings-payment-gateways__header">
				<div className="settings-payment-gateways__header-title">
					{ __( 'Payment methods', 'woocommerce' ) }
				</div>
			</div>
			{ isFetching ? (
				<ListPlaceholder rows={ 3 } />
			) : (
				<OfflinePaymentGatewayList
					gateways={ offlinePaymentGateways }
					setGateways={ updateOrdering }
				/>
			) }
		</div>
	);
};
