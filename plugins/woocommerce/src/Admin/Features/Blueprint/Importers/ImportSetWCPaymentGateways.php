<?php

namespace Automattic\WooCommerce\Admin\Features\Blueprint\Importers;

use Automattic\WooCommerce\Admin\Features\Blueprint\Steps\SetWCPaymentGateways;
use Automattic\WooCommerce\Blueprint\StepProcessor;
use Automattic\WooCommerce\Blueprint\StepProcessorResult;

class ImportSetWCPaymentGateways implements StepProcessor {
	public function process($schema): StepProcessorResult {
		$result = StepProcessorResult::success(self::class);
		$payment_gateways = WC()->payment_gateways->payment_gateways();
		$fields = array('title', 'description', 'enabled');

		foreach ($schema->payment_gateways as $id => $payment_gateway_data) {
			if (!isset($payment_gateways[$id])) {
				$result->add_info("Skipping {$id}. The payment gateway is not available");
			}

			$payment_gateway = $payment_gateways[$id];

			// @todo when enabling, we need to check if the payment gateways needs setup
			// refer to https://github.com/woocommerce/woocommerce/blob/trunk/plugins/woocommerce/includes/class-wc-ajax.php#L3564
			foreach ($fields as $field) {
				if (isset($payment_gateway_data->{$field})) {
					$payment_gateway->update_option($field, $payment_gateway_data->{$field});
				}
			}
			$result->add_info("{$id} has been updated.");
			do_action( 'woocommerce_update_options' );
		}

		return $result;
	}

	public function get_step_class(): string {
		return SetWCPaymentGateways::class;
	}
}