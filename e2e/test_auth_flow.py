from uuid import uuid4

from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait


def test_user_can_register_logout_and_login(browser, frontend_url):
    wait = WebDriverWait(browser, 10)
    email = f"e2e-{uuid4().hex[:10]}@example.com"
    username = f"e2e_{uuid4().hex[:8]}"
    password = "secure-pass-123"

    browser.get(f"{frontend_url}/register")
    browser.find_element(By.NAME, "email").send_keys(email)
    browser.find_element(By.NAME, "username").send_keys(username)
    browser.find_element(By.NAME, "password").send_keys(password)
    browser.find_element(By.CSS_SELECTOR, "button[type='submit']").click()

    wait.until(EC.url_contains("/tasks"))
    wait.until(EC.visibility_of_element_located((By.TAG_NAME, "h1")))
    assert "Tasks" in browser.find_element(By.TAG_NAME, "h1").text

    browser.find_element(By.CSS_SELECTOR, "button[aria-label='Log out']").click()
    wait.until(EC.url_contains("/login"))

    browser.find_element(By.NAME, "email").send_keys(email)
    browser.find_element(By.NAME, "password").send_keys(password)
    browser.find_element(By.CSS_SELECTOR, "button[type='submit']").click()

    wait.until(EC.url_contains("/tasks"))
    assert "Tasks" in browser.find_element(By.TAG_NAME, "h1").text
