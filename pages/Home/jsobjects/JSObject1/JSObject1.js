export default {
  runSearch: async () => {
    const term = inp_search.text;
    if (term && term.trim().length >= 2) {
      await qry_global_search.run();
    }
  },

navigate: () => {
  const i = cwgt_search_results.model.selectedItem;
  console.log('selectedItem:', JSON.stringify(i));
  if (!i || !i.result_type) return;
  if (i.result_type === 'asset') {
    navigateTo('Asset_Page', { asset_id: i.record_id }, 'SAME_WINDOW');
  } else if (i.result_type === 'collection') {
    navigateTo('Collection_Job_View', { job_id: i.record_id }, 'SAME_WINDOW');
  } else if (i.result_type === 'customer') {
    navigateTo('Customer_Details_Page', { customer_id: i.record_id }, 'SAME_WINDOW');
  }
}
}