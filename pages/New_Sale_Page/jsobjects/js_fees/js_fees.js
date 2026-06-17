export default {
  get feePercentage() {
    return Number(GetPlatformFee.data?.[0]?.fee_percentage || 0);
  },

  calculateFee(sellPrice) {
    const pct = this.feePercentage;
    return Number((sellPrice * (pct / 100)).toFixed(2));
  }
};
