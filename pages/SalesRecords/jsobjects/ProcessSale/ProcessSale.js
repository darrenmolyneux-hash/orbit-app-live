export default {
  async run() {
    const items = appsmith.store.saleList || [];

    if (items.length === 0) {
      showAlert("No items in sale", "warning");
      return;
    }

    // 1. Calculate total price
    const total = items.reduce(
      (sum, item) => sum + Number(item.sell_price || 0),
      0
    );

    // 2. Insert sale header
    const saleHeader = await InsertSaleHeader.run({
      total_price: total
    });

    const sale_id = saleHeader[0].sale_id;
    const sale_ref = saleHeader[0].sale_ref;

    // 3. Insert each sale item + mark asset sold
    for (let item of items) {
      await InsertSaleItem.run({
        sale_id: sale_id,
        asset_id: item.asset_id,
        sell_price: item.sell_price
      });

      await MarkAssetSold.run({
        asset_id: item.asset_id,
        sale_id: sale_id
      });
    }

    // 4. Clear the sale list
    storeValue("saleList", []);

    // 5. Show success message
    showAlert("Sale processed: " + sale_ref, "success");

    return sale_ref;
  }
}
