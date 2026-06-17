export default {
  async getItemTypes() {
    await qry_item_types_list.run();

    return qry_item_types_list.data.map(d => ({
      label: d.item_type_name,
      value: d.item_type_id + ""
    }));
  },

  async selectItemType(value) {
    await storeValue("selectedItemType", value);

    const selectedType = qry_item_types_list.data.find(
      d => String(d.item_type_id) === String(value)
    );

    await storeValue(
      "isDataBearing",
      selectedType?.is_data_bearing === true || selectedType?.is_data_bearing === "true"
    );

    await qry_makes_list.run();

    return qry_makes_list.data;
  }
}