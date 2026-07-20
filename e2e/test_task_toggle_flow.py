from uuid import uuid4

from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait

from helpers import register_user


def test_user_can_toggle_task_completion(browser, frontend_url):
    wait = WebDriverWait(browser, 10)
    title = f"Toggle {uuid4().hex[:6]}"

    register_user(browser, frontend_url)
    browser.find_element(By.CSS_SELECTOR, "input[aria-label='Task title']").send_keys(title)
    browser.find_element(By.CSS_SELECTOR, ".task-form button[type='submit']").click()

    wait.until(EC.text_to_be_present_in_element((By.CLASS_NAME, "task-list"), title))
    task_card = browser.find_element(By.XPATH, f"//article[contains(., '{title}')]")
    task_card.find_element(By.CSS_SELECTOR, "button[aria-label='Toggle completion']").click()

    wait.until(
        lambda driver: "completed"
        in driver.find_element(By.XPATH, f"//article[contains(., '{title}')]").text.lower()
    )
    assert "completed" in browser.find_element(By.XPATH, f"//article[contains(., '{title}')]").text.lower()
