from uuid import uuid4

from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait


def register_user(browser, frontend_url):
    token = uuid4().hex[:10]
    email = f"e2e-{token}@example.com"
    password = "secure-pass-123"

    browser.get(f"{frontend_url}/register")
    browser.find_element(By.NAME, "email").send_keys(email)
    browser.find_element(By.NAME, "username").send_keys(f"e2e_{token}")
    browser.find_element(By.NAME, "password").send_keys(password)
    browser.find_element(By.CSS_SELECTOR, "button[type='submit']").click()
    WebDriverWait(browser, 10).until(EC.url_contains("/tasks"))

    return {"email": email, "password": password}


def login_user(browser, frontend_url, email, password):
    browser.get(f"{frontend_url}/login")
    browser.find_element(By.NAME, "email").send_keys(email)
    browser.find_element(By.NAME, "password").send_keys(password)
    browser.find_element(By.CSS_SELECTOR, "button[type='submit']").click()
    WebDriverWait(browser, 10).until(EC.url_contains("/tasks"))
