import { expect, test } from "@playwright/test";

test.describe("Home Page", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/");
	});

	test("should load home page with correct title", async ({ page }) => {
		await expect(page).toHaveTitle(/Crowd Symphony/);
	});

	test("should display hero section with headline", async ({ page }) => {
		await expect(page.locator("h1")).toContainText("One room");
		await expect(page.locator("h1")).toContainText("Every phone");
		await expect(page.locator("h1")).toContainText("Your hands");
	});

	test("should have Start conducting button linking to conductor page", async ({
		page,
	}) => {
		const startButton = page.locator('a:has-text("Start conducting")');
		await expect(startButton).toBeVisible();
		await expect(startButton).toHaveAttribute("href", "/conductor");
	});

	test("should have Join audience button linking to audience page", async ({
		page,
	}) => {
		const joinButton = page.locator('a:has-text("Join with a room code")');
		await expect(joinButton).toBeVisible();
		await expect(joinButton).toHaveAttribute("href", "/audience");
	});

	test("should display how it works steps", async ({ page }) => {
		await expect(page.locator("text=Start conducting")).toBeVisible();
		await expect(page.locator("text=Share the room")).toBeVisible();
		await expect(page.locator("text=Raise your hands")).toBeVisible();
	});

	test("should have GitHub link in navigation", async ({ page }) => {
		const githubLink = page.locator(
			'a[href*="github.com/taranggoyal70/crowd-symphony"]',
		);
		await expect(githubLink).toBeVisible();
	});
});

test.describe("Audience Page - Entry Flow", () => {
	test("should show entry page when no session parameter", async ({ page }) => {
		await page.goto("/audience");
		await expect(page.locator("h1")).toContainText("Step into");
		await expect(page.locator("text=Phone becomes instrument")).toBeVisible();
	});

	test("should show room code input form", async ({ page }) => {
		await page.goto("/audience");
		await expect(page.locator('input[placeholder="ABC123"]')).toBeVisible();
		await expect(page.locator('button:has-text("Join signal")')).toBeVisible();
	});

	test("should navigate to audience with session parameter", async ({
		page,
	}) => {
		await page.goto("/audience?session=TEST123");
		// Should show side selection since no section chosen yet
		await expect(page.locator("h1")).toContainText("Choose your");
		await expect(page.locator("text=side of the room")).toBeVisible();
	});

	test("should show left and right side options", async ({ page }) => {
		await page.goto("/audience?session=TEST123");
		await expect(page.locator("text=Channel L")).toBeVisible();
		await expect(page.locator("text=Left")).toBeVisible();
		await expect(page.locator("text=Channel R")).toBeVisible();
		await expect(page.locator("text=Right")).toBeVisible();
	});
});

test.describe("Conductor Page", () => {
	test("should load conductor page with session parameter", async ({
		page,
	}) => {
		await page.goto("/conductor?session=TEST123");
		await expect(page.locator("text=CROWD SYMPHONY")).toBeVisible();
		await expect(page.locator("text=TEST123")).toBeVisible();
	});

	test("should show camera start button", async ({ page }) => {
		await page.goto("/conductor?session=TEST123");
		await expect(page.locator('button:has-text("START")')).toBeVisible();
	});

	test("should show QR code button", async ({ page }) => {
		await page.goto("/conductor?session=TEST123");
		await expect(page.locator('button:has-text("QR")')).toBeVisible();
	});

	test("should show volume controls for left and right", async ({ page }) => {
		await page.goto("/conductor?session=TEST123");
		await expect(page.locator("text=LEFT")).toBeVisible();
		await expect(page.locator("text=RIGHT")).toBeVisible();
		await expect(page.locator("text=50")).toBeVisible(); // Default volume
	});
});

test.describe("Host Page", () => {
	test("should load host page with room parameter", async ({ page }) => {
		await page.goto("/host?room=TEST123");
		await expect(page.locator("h1")).toContainText("Host a crowd symphony");
		await expect(page.locator("text=TEST123")).toBeVisible();
	});

	test("should show audience join QR code", async ({ page }) => {
		await page.goto("/host?room=TEST123");
		await expect(page.locator("text=Scan to join")).toBeVisible();
	});

	test("should show show controls (Start/Stop)", async ({ page }) => {
		await page.goto("/host?room=TEST123");
		await expect(page.locator('button:has-text("Start")')).toBeVisible();
		await expect(page.locator('button:has-text("Stop")')).toBeVisible();
	});

	test("should show track selection", async ({ page }) => {
		await page.goto("/host?room=TEST123");
		await expect(page.locator("text=Track selection")).toBeVisible();
		await expect(page.locator("text=Epic Orchestra")).toBeVisible();
		await expect(page.locator("text=Epic Dubstep Mix")).toBeVisible();
	});

	test("should show moment trigger buttons", async ({ page }) => {
		await page.goto("/host?room=TEST123");
		await expect(page.locator("text=Full Crowd Pulse")).toBeVisible();
		await expect(page.locator("text=Left Side Drop")).toBeVisible();
		await expect(page.locator("text=Right Side Drop")).toBeVisible();
		await expect(page.locator("text=Blackout Build")).toBeVisible();
		await expect(page.locator("text=Finale Burst")).toBeVisible();
	});
});

test.describe("Recap Page", () => {
	test("should show no room message when no room parameter", async ({
		page,
	}) => {
		await page.goto("/recap");
		await expect(page.locator("text=No room selected")).toBeVisible();
		await expect(page.locator("text=Open this from a host room")).toBeVisible();
	});

	test("should load recap page with room parameter", async ({ page }) => {
		await page.goto("/recap?room=TEST123");
		await expect(page.locator("text=TEST123")).toBeVisible();
		await expect(page.locator("text=Live event recap")).toBeVisible();
	});
});

test.describe("API Routes", () => {
	test("should return 400 for invalid session in realtime API", async ({
		request,
	}) => {
		const response = await request.get("/api/realtime?session=invalid@session");
		expect(response.status()).toBe(400);
		const body = await response.json();
		expect(body.error).toContain("invalid");
	});

	test("should return 404 for non-existent session", async ({ request }) => {
		const response = await request.get("/api/realtime?session=NONEXISTENT123");
		expect(response.status()).toBe(404);
	});

	test("should return 400 for invalid POST body", async ({ request }) => {
		const response = await request.post("/api/realtime", {
			data: { invalid: "data" },
		});
		expect(response.status()).toBe(400);
	});
});

test.describe("Accessibility", () => {
	test("home page should have proper heading hierarchy", async ({ page }) => {
		await page.goto("/");
		const h1 = page.locator("h1");
		await expect(h1).toHaveCount(1);
	});

	test("buttons should have accessible names", async ({ page }) => {
		await page.goto("/");
		const startButton = page.locator('a:has-text("Start conducting")');
		await expect(startButton).toHaveAttribute("href");
	});

	test("form inputs should have labels", async ({ page }) => {
		await page.goto("/audience");
		const input = page.locator('input[placeholder="ABC123"]');
		await expect(input).toHaveAttribute("id");
		const label = page.locator(
			`label[for="${await input.getAttribute("id")}"]`,
		);
		await expect(label).toBeVisible();
	});
});

test.describe("Responsive Design", () => {
	test("should work on mobile viewport", async ({ page }) => {
		await page.setViewportSize({ width: 375, height: 667 });
		await page.goto("/");
		await expect(page.locator("h1")).toBeVisible();
	});

	test("should work on tablet viewport", async ({ page }) => {
		await page.setViewportSize({ width: 768, height: 1024 });
		await page.goto("/");
		await expect(page.locator("h1")).toBeVisible();
	});

	test("should work on desktop viewport", async ({ page }) => {
		await page.setViewportSize({ width: 1920, height: 1080 });
		await page.goto("/");
		await expect(page.locator("h1")).toBeVisible();
	});
});
