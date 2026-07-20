from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait


def test_login_page_loads(browser, frontend_url):
    browser.get(f"{frontend_url}/login")

    wait = WebDriverWait(browser, 10)
    wait.until(EC.visibility_of_element_located((By.TAG_NAME, "h1")))

    assert "Log in" in browser.find_element(By.TAG_NAME, "h1").text
    assert browser.find_element(By.NAME, "email").is_displayed()
    assert browser.find_element(By.NAME, "password").is_displayed()
