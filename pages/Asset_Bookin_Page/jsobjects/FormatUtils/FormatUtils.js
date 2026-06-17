export default {
  titleCase(str) {
    if (!str) return "";
    return str
      .toLowerCase()
      .replace(/\b\w/g, c => c.toUpperCase());
  },

  upper(str) {
    if (!str) return "";
    return str.toUpperCase();
  }
}
