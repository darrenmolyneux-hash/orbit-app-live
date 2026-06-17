export default {
init: () => {
  storeValue('stock_type_filter', '');
  storeValue('stock_grade_filter', '');
  storeValue('hp_part_type_id', '');
  storeValue('hp_condition_grade', '');
  storeValue('hp_spec', '');
  storeValue('hp_serial', '');
  storeValue('hp_removed_by', '');
  storeValue('hp_notes', '');
  qry_get_part_types.run();
  qry_get_asset_parts.run();
  qry_get_parts_stock.run();
},

 logRemoval: () => {
  var data = Custom6.model;
  storeValue('hp_part_type_id', data.hp_part_type_id);
  storeValue('hp_condition_grade', data.hp_condition_grade);
  storeValue('hp_spec', data.hp_spec || '');
  storeValue('hp_serial', data.hp_serial || '');
  storeValue('hp_removed_by', data.hp_removed_by || '');
  storeValue('hp_notes', data.hp_notes || '');
  return qry_get_next_part_ref.run().then(() => {
    return qry_insert_harvested_part.run().then(() => {
      return qry_get_asset_parts.run();
    });
  });
},

  installPart: (data) => {
    storeValue('hp_install_id', data.id);
    return qry_install_part.run().then(() => {
      qry_get_asset_parts.run();
      qry_get_parts_stock.run();
    });
  }
}