(function() {
  'use strict';

  function PopupCtrl($scope, $timeout, RatesService, chrome) {
    var vm = this;

    vm.mode = '';
    vm.rates = [];
    vm.gap = null;
    vm.lastUpdated = null;
    vm.calculatorMode = false;
    vm.loaded = loaded;
    vm.refreshRates = refreshRates;
    vm.refreshing = false;

    // Set up events listeners and display rates
    setupListeners();
    RatesService.get(updateDisplayedRates);

    /**
     * Returns true if any rates were loaded
     *
     * @return {boolean}
     */
    function loaded() {
      return vm.rates.length;
    }

    /**
     * Refreshes rates calling RatesService
     *
     * @return {undefined}
     */
    function refreshRates() {
      vm.refreshing = true;
      RatesService.refreshRates();
    }

    /**
     * Set up controller events.
     * Registers rates updated listener.
     *
     * @return {undefined}
     */
    function setupListeners() {
      // Listen to rates update
      var ratesUpdatedListener = $scope.$on('rates:updated', function() {

        // Disable manual refreshing during one minute
        vm.refreshing = null;
        $timeout(function() {
          vm.refreshing = false;
        }, 60 * 1000);

        RatesService.get(updateDisplayedRates);
      });

      // Deregister rates update listener on destroy
      $scope.$on('$destroy', ratesUpdatedListener);
    }

    /**
     * Updates displayed rates.
     * Prepares view vars and calculates gap between blue/oficial.
     *
     * @param  {Array} rates Array of rates info
     * @return {undefined}
     */
    function updateDisplayedRates(rates) {
      if (typeof rates !== 'undefined' && rates !== null) {
        vm.rates = [
          {
            name: 'Oficial',
            sell: rates.oficial.sell,
            buy: rates.oficial.buy,
            variation: rates.oficial.variation,
            icon: 'money'
          },
          {
            name: 'Blue',
            sell: rates.blue.sell,
            buy: rates.blue.buy,
            variation: rates.blue.variation,
            icon: 'money'
          },
          {
            name: 'Mayorista',
            sell: rates.mayorista.sell,
            buy: rates.mayorista.buy,
            variation: rates.mayorista.variation,
            icon: 'money'
          }
        ];

        vm.gapBuy = Math.abs(rates.blue.buy - rates.oficial.buy);
        vm.gapBuyPercentage = vm.gapBuy * 100 / rates.blue.buy;
        vm.gapSell = Math.abs(rates.blue.sell - rates.oficial.sell);
        vm.gapSellPercentage = vm.gapSell * 100 / rates.blue.sell;

        vm.lastUpdated = rates.date;
      }

      // Apply changes to view
      $timeout(function() {
        $scope.$apply();
      });
    }
  }

  angular.module('dbiPopup').controller('PopupCtrl', PopupCtrl);

})();
