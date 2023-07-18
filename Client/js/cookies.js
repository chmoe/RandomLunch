// 从 Cookie 中获取特定名称的值
function getCookie(name) {
    const cookieName = name + "=";
    const cookieArray = document.cookie.split(";");
  
    for (let i = 0; i < cookieArray.length; i++) {
      let cookie = cookieArray[i];
  
      while (cookie.charAt(0) === " ") {
        cookie = cookie.substring(1);
      }
  
      if (cookie.indexOf(cookieName) === 0) {
        return cookie.substring(cookieName.length, cookie.length);
      }
    }
  
    return "";
  }
  
  // 设置 Cookie
  function setCookie(name, value, days) {
    const expirationDate = new Date();
    expirationDate.setTime(expirationDate.getTime() + (days * 24 * 60 * 60 * 1000));
    const expires = "expires=" + expirationDate.toUTCString();
    document.cookie = name + "=" + value + ";" + expires + ";path=/";
  }
  