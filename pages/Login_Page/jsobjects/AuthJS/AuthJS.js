export default {
  login() {
    storeValue("user", LoginAPI.data);
    navigateTo("Home");
  }
}
