from playwright.sync_api import sync_playwright

def test_admin_expense(page):
    page.goto("http://localhost:9002/admin")
    page.wait_for_timeout(2000)

    # Go to Transaction tab
    page.click("text=Transaksi")
    page.wait_for_timeout(1000)

    # Click Tambah Transaksi
    page.click("text=Tambah Transaksi")
    page.wait_for_timeout(1000)

    # Click Pengeluaran
    page.click("text=Pengeluaran")
    page.wait_for_timeout(1000)

    # Try to open the Select
    page.click("text=Pilih anggota (opsional)")
    page.wait_for_timeout(500)

    # Take screenshot
    page.screenshot(path="test_screen.png")

with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page()
    test_admin_expense(page)
    browser.close()
