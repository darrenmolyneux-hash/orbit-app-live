export default {
  updateStatus: async () => {
    showAlert('updateStatus fired', 'success');
    const newStatusId = Custom5.model.selectedStatusId;
    await UpdateAssetStatus.run();
    await InsertAssetAuditLog.run();
    await qry_insert_status_history.run();
    await qry_GetAssetById.run();
  },
  viewSale: () => {
    const saleId = Custom5.model.saleId;
    if (!saleId) {
      showAlert('No sale linked to this asset', 'warning');
      return;
    }
    navigateTo('SaleDetails', { sale_id: saleId }, 'SAME_WINDOW');
  },
  saveCost: async () => {
    await UpdateOriginalCost.run();
    await qry_GetAssetById.run();
  },
  onTabChange: async () => {
    if (Tabs1.selectedTab === 'Grading') {
      await Query3qry_grading_get.run();
    }
  },
  saveGrading: async () => {
    await qry_grading_save.run();
    await qry_update_overall_grade.run();
    await qry_GetAssetById.run();
  }
}