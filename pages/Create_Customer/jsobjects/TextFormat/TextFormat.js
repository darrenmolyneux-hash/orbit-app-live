export default {
  titleCase: (value = "") => {
    return value
      .toLowerCase()
      .replace(/\b\w/g, char => char.toUpperCase());
  },

  upperCase: (value = "") => {
    return value.toUpperCase().replace(/\s/g, "");
  }
}