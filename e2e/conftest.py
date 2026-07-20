import os

import pytest
from selenium import webdriver
from selenium.webdriver.chrome.options import Options


@pytest.fixture
def frontend_url():
    return os.getenv("E2E_FRONTEND_URL", "http://localhost:5173")


@pytest.fixture
def backend_url():
    return os.getenv("E2E_BACKEND_URL", "http://localhost:8000")


@pytest.fixture
def browser():
    options = Options()
    options.add_argument("--headless=new")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--window-size=1440,1000")

    driver = webdriver.Chrome(options=options)
    try:
        yield driver
    finally:
        driver.quit()
