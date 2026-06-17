export default {
  bookUploaded: async () => {
    var rows = Custom2.model.upload_rows;
    if (!rows || !rows.length) return;
    var bookedRefs = [];
    for (var i = 0; i < rows.length; i++) {
      var row = rows[i];
      storeValue('pendingItemType', row.item_type);
      storeValue('pendingMake', row.make);
      storeValue('pendingModel', row.model);
      storeValue('pendingSerial', row.serial);
			storeValue('pendingDataBearing', row.data_bearing);
      await qry_next_asset_ref.run();
      var ref = qry_next_asset_ref.data[0].asset_ref;
      bookedRefs.push(ref);
      await qry_upload_asset_insert.run();
    }
   storeValue('bookedRefs', bookedRefs);
showAlert('Booked ' + bookedRefs.length + ' assets successfully', 'success');
await new Promise(resolve => setTimeout(resolve, 500));
qry_booked_assets.run();
  }
}