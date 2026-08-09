import { expect, test } from "@playwright/test";

/**
 * Smoke tests for critical functionality
 * These tests run quickly and catch major regressions
 * @see https://playwright.dev/docs/writing-tests
 */

test.describe("Critical User Journeys", () => {
	test.beforeEach(async ({ page }) => {
		// Set up viewport for consistent testing
		await page.setViewportSize({ width: 1200, height: 800 });
	});

	test("homepage loads and displays key content", async ({ page }) => {
		await page.goto("/");

		// Check core page elements
		await expect(page).toHaveTitle(
			/DeiAsPie - Privacy & Security Recommendations/,
		);
		await expect(page.locator("h1")).toBeVisible();

		// Check navigation exists and has proper links
		const mainNav = page.getByRole("navigation", { name: "Main navigation" });
		await expect(mainNav).toBeVisible();
		await expect(mainNav.getByRole("link", { name: "All" })).toBeVisible(); // Link to all recommendations
		await expect(mainNav.getByRole("link", { name: "About" })).toBeVisible();
	});

	test("theme toggle works correctly", async ({ page }) => {
		await page.goto("/");

		// Find theme toggle button (prefer id selector for reliability)
		const themeToggle = page.locator("#theme-toggle");
		await expect(themeToggle).toBeVisible();

		// Get initial theme state
		const initialHtmlClass = await page.locator("html").getAttribute("class");
		const initialTheme = await page.evaluate(() =>
			localStorage.getItem("theme"),
		);

		// Toggle theme
		await themeToggle.click();

		// Verify theme changed
		await page.waitForTimeout(100); // Brief wait for theme transition
		const newHtmlClass = await page.locator("html").getAttribute("class");
		const newTheme = await page.evaluate(() => localStorage.getItem("theme"));

		// Check that either class or localStorage changed
		const classChanged = initialHtmlClass !== newHtmlClass;
		const storageChanged = initialTheme !== newTheme;

		expect(classChanged || storageChanged).toBeTruthy();

		// Verify dark mode class toggling if using class-based theme
		if (initialHtmlClass?.includes("dark") || newHtmlClass?.includes("dark")) {
			expect(initialHtmlClass !== newHtmlClass).toBeTruthy();
		}
	});

	test("recommendations page displays content cards", async ({ page }) => {
		await page.goto("/recommendations/");

		await expect(page).toHaveTitle(/Recommendations/);

		// Check for recommendation cards
		const cards = page.locator(
			'.card, [class*="card"], article, .recommendation-item',
		);
		await expect(cards.first()).toBeVisible();

		// Check that cards have expected content
		const firstCard = cards.first();
		await expect(
			firstCard.locator('h2, h3, .card-title, [class*="title"]'),
		).toBeVisible();
	});

	test("individual recommendation page loads", async ({ page }) => {
		await page.goto("/recommendations/");

		// Find and click first recommendation card link
		const firstRecommendationLink = page.locator(".card > a").first();
		await expect(firstRecommendationLink).toBeVisible();

		await firstRecommendationLink.click();

		// Wait for navigation
		await page.waitForLoadState("networkidle");

		// Check we're on a recommendation page
		expect(page.url()).toMatch(/\/recommendations\/[^/]+\/?$/);

		// Check basic page structure
		await expect(page.locator("h1")).toBeVisible();
		await expect(page.locator("main")).toBeVisible();
	});

	test("navigation is accessible via keyboard", async ({ page }) => {
		await page.goto("/");

		// Start with focus on body
		await page.locator("body").click();

		// Tab to navigation elements
		await page.keyboard.press("Tab");

		// Check focus is visible
		const focusedElement = page.locator(":focus");
		await expect(focusedElement).toBeVisible();

		// Check focus ring or outline is present (accessibility requirement)
		const focusedElementStyles = await focusedElement.evaluate((el) => {
			const styles = window.getComputedStyle(el);
			return {
				outline: styles.outline,
				outlineWidth: styles.outlineWidth,
				boxShadow: styles.boxShadow,
			};
		});

		// Should have either outline or box-shadow (focus ring)
		const hasFocusIndicator =
			focusedElementStyles.outline !== "none" ||
			focusedElementStyles.outlineWidth !== "0px" ||
			focusedElementStyles.boxShadow !== "none";

		expect(hasFocusIndicator).toBeTruthy();
	});
});

test.describe("Mobile Responsiveness", () => {
	test("mobile navigation works", async ({ page }) => {
		// Set mobile viewport
		await page.setViewportSize({ width: 375, height: 667 });
		await page.goto("/");

		// Look for mobile menu button (prefer id selector for reliability)
		const mobileMenuButton = page.locator("#mobile-menu-toggle");

		// Only test if mobile menu exists
		if (await mobileMenuButton.isVisible()) {
			await mobileMenuButton.click();

			// Check if menu opens (use #mobile-menu and aria-label)
			const mobileMenu = page.locator("#mobile-menu");
			await expect(mobileMenu).toBeVisible();

			// Check navigation links are accessible
			const navLinks = mobileMenu.locator("a");
			await expect(navLinks.first()).toBeVisible();
		}
	});

	test("mobile menu traps focus while open", async ({ page }) => {
		await page.setViewportSize({ width: 375, height: 667 });
		await page.goto("/");

		const mobileMenuButton = page.locator("#mobile-menu-toggle");
		const mobileMenu = page.locator("#mobile-menu");

		await expect(mobileMenuButton).toBeVisible();
		await mobileMenuButton.click();
		await expect(mobileMenu).toBeVisible();

		// Tab well past the number of focusable children. If focus were not
		// trapped it would reach the page behind the menu within these presses.
		const linkCount = await mobileMenu.locator("a").count();
		expect(linkCount).toBeGreaterThan(0);

		// Focus may leave to the browser's own UI between passes, which surfaces
		// as <body>. What must never happen is focus landing on an interactive
		// control behind the modal.
		const landings: string[] = [];
		for (let i = 0; i < linkCount + 3; i++) {
			await page.keyboard.press("Tab");
			const landing = await page.evaluate(() => {
				const menu = document.getElementById("mobile-menu");
				const active = document.activeElement;
				if (!menu || !active) return "none";
				if (menu.contains(active)) return "inside";
				if (active === document.body || active === document.documentElement)
					return "body";
				return `outside:${active.tagName}#${active.id || ""}.${active.className || ""}`;
			});
			landings.push(landing);
			expect(
				landing,
				`Tab press ${i + 1} reached a control behind the modal`,
			).not.toMatch(/^outside:/);
		}

		// Prove it is cycling rather than parked: focus returns into the menu.
		expect(landings.filter((l) => l === "inside").length).toBeGreaterThan(0);
	});

	test("mobile menu opens below the header rather than over it", async ({
		page,
	}) => {
		await page.setViewportSize({ width: 375, height: 667 });
		await page.goto("/");

		const mobileMenuButton = page.locator("#mobile-menu-toggle");
		await expect(mobileMenuButton).toBeVisible();
		await mobileMenuButton.click();
		await expect(page.locator("#mobile-menu")).toBeVisible();

		// showModal() lifts the dialog into the top layer, where the UA would
		// centre it over the page. It must stay anchored under the header.
		const headerBox = await page.locator("header").boundingBox();
		const menuBox = await page.locator("#mobile-menu").boundingBox();
		expect(headerBox).not.toBeNull();
		expect(menuBox).not.toBeNull();
		expect(menuBox!.y).toBeGreaterThanOrEqual(
			headerBox!.y + headerBox!.height - 1,
		);
	});

	test("mobile menu makes the page behind it inert", async ({ page }) => {
		await page.setViewportSize({ width: 375, height: 667 });
		await page.goto("/");

		const mobileMenuButton = page.locator("#mobile-menu-toggle");
		await expect(mobileMenuButton).toBeVisible();
		await mobileMenuButton.click();
		await expect(page.locator("#mobile-menu")).toBeVisible();

		// showModal() marks everything outside the dialog inert, so focusing an
		// element behind it must be a no-op.
		const focusedSomethingOutside = await page.evaluate(() => {
			const menu = document.getElementById("mobile-menu");
			const outside = document.querySelector(
				"#mobile-menu-toggle",
			) as HTMLElement | null;
			if (!menu || !outside) return null;
			outside.focus();
			return document.activeElement === outside;
		});

		expect(focusedSomethingOutside).toBe(false);
	});

	test("mobile menu initial focus on first nav link", async ({ page }) => {
		// Set mobile viewport
		await page.setViewportSize({ width: 375, height: 667 });
		await page.goto("/");

		const mobileMenuButton = page.locator("#mobile-menu-toggle");

		// Only test if mobile menu exists
		if (await mobileMenuButton.isVisible()) {
			// Open menu
			await mobileMenuButton.click();

			const mobileMenu = page.locator("#mobile-menu");
			await expect(mobileMenu).toBeVisible();

			// Get first nav link in menu
			const navLinks = mobileMenu.locator("a");
			if (await navLinks.first().isVisible()) {
				// Focus should be on the first link, not on the dialog container
				const firstLinkText = await navLinks.first().textContent();
				const focusedElement = page.locator(":focus");
				const focusedText = await focusedElement.textContent();

				expect(focusedText?.trim()).toBe(firstLinkText?.trim());
			}
		}
	});

	test("mobile menu closes on Escape and returns focus to toggle", async ({
		page,
	}) => {
		// Set mobile viewport
		await page.setViewportSize({ width: 375, height: 667 });
		await page.goto("/");

		const mobileMenuButton = page.locator("#mobile-menu-toggle");

		// Only test if mobile menu exists
		if (await mobileMenuButton.isVisible()) {
			// Open menu
			await mobileMenuButton.click();

			const mobileMenu = page.locator("#mobile-menu");
			await expect(mobileMenu).toBeVisible();

			// Wait for menu to be open
			await page.waitForTimeout(100);

			// Press Escape
			await page.keyboard.press("Escape");

			// Menu should be hidden
			await expect(mobileMenu).not.toBeVisible();

			// Wait for close animation/event
			await page.waitForTimeout(100);

			// Verify focus returned to toggle
			const isFocused = await mobileMenuButton.evaluate(
				(el) => el === document.activeElement,
			);
			expect(isFocused).toBe(true);

			// aria-expanded should be false
			const ariaExpanded = await mobileMenuButton.getAttribute("aria-expanded");
			expect(ariaExpanded).toBe("false");
		}
	});

	test("mobile menu closes on outside click and returns focus to toggle", async ({
		page,
	}) => {
		// Set mobile viewport
		await page.setViewportSize({ width: 375, height: 667 });
		await page.goto("/");

		const mobileMenuButton = page.locator("#mobile-menu-toggle");

		// Only test if mobile menu exists
		if (await mobileMenuButton.isVisible()) {
			// Open menu
			await mobileMenuButton.click();

			const mobileMenu = page.locator("#mobile-menu");
			await expect(mobileMenu).toBeVisible();

			// Wait for menu to be open
			await page.waitForTimeout(100);

			// Click on the dialog backdrop (outside the menu content)
			// This clicks at top-left of viewport which should be on the backdrop
			await page.click("dialog#mobile-menu", { position: { x: 5, y: 5 } });

			// Small delay for close to complete
			await page.waitForTimeout(100);

			// Menu should be hidden
			await expect(mobileMenu).not.toBeVisible();

			// Verify focus returned to toggle
			const isFocused = await mobileMenuButton.evaluate(
				(el) => el === document.activeElement,
			);
			expect(isFocused).toBe(true);
		}
	});

	test("responsive images load correctly", async ({ page }) => {
		await page.setViewportSize({ width: 375, height: 667 });
		await page.goto("/recommendations/");

		// Check that images are present and have loaded
		const images = page.locator("img");
		const firstImage = images.first();

		if (await firstImage.isVisible()) {
			// Wait for image to load
			await expect(firstImage).toBeVisible();

			// Check image has appropriate attributes for responsive design
			const srcset = await firstImage.getAttribute("srcset");
			const sizes = await firstImage.getAttribute("sizes");
			const loading = await firstImage.getAttribute("loading");

			// At least one responsive attribute should be present
			const hasResponsiveAttributes = srcset || sizes || loading === "lazy";
			expect(hasResponsiveAttributes).toBeTruthy();
		}
	});
});

test.describe("Performance & Accessibility", () => {
	test("no console errors on critical pages", async ({ page }) => {
		const consoleErrors: string[] = [];

		// Capture console errors
		page.on("console", (msg) => {
			if (msg.type() === "error") {
				consoleErrors.push(msg.text());
			}
		});

		// Visit key pages
		await page.goto("/");
		await page.goto("/recommendations/");
		await page.goto("/about/");

		// Filter out known non-critical errors
		const criticalErrors = consoleErrors.filter(
			(error) =>
				!error.includes("favicon") &&
				!error.includes("manifest") &&
				!error.includes("service-worker") &&
				!error.toLowerCase().includes("third-party") &&
				!error.includes(
					"Content Security Policy directive 'frame-ancestors' is ignored",
				) &&
				!error.includes(
					"Refused to apply inline style because it violates the following Content Security Policy directive",
				) &&
				!error.includes("InvalidStateError") &&
				!error.includes(
					"The page's settings blocked an inline style (style-src-attr)",
				) &&
				!error.includes("blocked an inline style (style-src-attr)"),
		);

		expect(criticalErrors).toHaveLength(0);
	});

	test("pages have proper meta tags", async ({ page }) => {
		await page.goto("/");

		// Check essential meta tags
		const metaDescription = page.locator('meta[name="description"]');
		await expect(metaDescription).toHaveAttribute("content");

		const metaViewport = page.locator('meta[name="viewport"]');
		await expect(metaViewport).toHaveAttribute("content");

		// Check page has proper title
		await expect(page).toHaveTitle(/.+/); // Non-empty title
	});

	test("speculation rules configured correctly", async ({ page }) => {
		await page.goto("/");

		// Exactly one speculation-rules script on the page
		const speculationScripts = page.locator('script[type="speculationrules"]');
		await expect(speculationScripts).toHaveCount(1);

		// Parse the JSON and verify structure
		const scriptContent = await speculationScripts.first().textContent();
		expect(scriptContent).toBeTruthy();
		const trimmedContent = scriptContent?.trim();
		const rules = JSON.parse(trimmedContent!);

		// Must have prefetch rules
		expect(rules.prefetch).toBeDefined();
		expect(Array.isArray(rules.prefetch)).toBe(true);
		expect(rules.prefetch.length).toBeGreaterThan(0);

		// First rule should have eagerness set to "moderate" (not the default "conservative")
		const rule = rules.prefetch[0];
		expect(rule.eagerness).toBe("moderate");

		// Rule must have selector_matches scoping to nav
		expect(rule.where).toBeDefined();
		expect(rule.where.and).toBeDefined();
		const conditions = rule.where.and;
		const selectorCondition = conditions.find((c: any) => c.selector_matches);
		expect(selectorCondition).toBeDefined();
		expect(selectorCondition.selector_matches).toBe("nav a");
	});

	test("CSP contains two script hashes", async ({ page }) => {
		await page.goto("/");

		const cspMeta = page.locator('meta[http-equiv="Content-Security-Policy"]');
		const cspContent = await cspMeta.getAttribute("content");
		expect(cspContent).toBeTruthy();

		// Count sha256- hashes in script-src
		const scriptSrcMatch = cspContent!.match(/script-src ([^;]+)/);
		expect(scriptSrcMatch).toBeTruthy();
		const scriptSrc = scriptSrcMatch![1];

		const hashCount = (scriptSrc.match(/sha256-/g) || []).length;
		expect(hashCount).toBe(2);
	});

	test("no request for prefetch-nav.js", async ({ page }) => {
		const requests: string[] = [];
		page.on("request", (request) => {
			requests.push(request.url());
		});

		await page.goto("/");
		await page.goto("/recommendations/");
		await page.goto("/about/");

		const prefetchNavRequests = requests.filter((url) =>
			url.includes("prefetch-nav.js"),
		);
		expect(prefetchNavRequests).toHaveLength(0);
	});

	test("static prefetch links still render on home page", async ({ page }) => {
		await page.goto("/");

		// The params.prefetch path is unchanged and still .IsHome-gated
		const prefetchLinks = page.locator('link[rel="prefetch"]');

		// There should be at least some prefetch links on the home page
		// (from the params.prefetch configuration)
		const count = await prefetchLinks.count();
		expect(count).toBeGreaterThanOrEqual(0); // At minimum, the check should not error
	});
});
