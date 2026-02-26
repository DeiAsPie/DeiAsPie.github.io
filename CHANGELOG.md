# Changelog

## [2.0.0](https://github.com/DeiAsPie/DeiAsPie.github.io/compare/deaispie-v1.0.0...deaispie-v2.0.0) (2026-02-26)


### ⚠ BREAKING CHANGES

* Removed the about page and associated content

### Features

* Add AGENTS guidelines for project workflows and security practices ([a8035e5](https://github.com/DeiAsPie/DeiAsPie.github.io/commit/a8035e514fe593e7dc42b303a5b09a4869341d5a))
* add base layout and new partials for header, footer, and pagination ([62db783](https://github.com/DeiAsPie/DeiAsPie.github.io/commit/62db783c8fbd775e0f81d2a867880b131326abdf))
* add BaseCS Season One and Two course content and `type="button"` attributes to header buttons ([b708068](https://github.com/DeiAsPie/DeiAsPie.github.io/commit/b7080684ba44402c00810e576b63ac43454d1858))
* Add comprehensive AGENTS guide for project workflows, automation, and QA processes ([9f0c880](https://github.com/DeiAsPie/DeiAsPie.github.io/commit/9f0c880d3be4dc8a0f22c258cf6cb56d888b1c95))
* Add comprehensive AI coding guidelines for project architecture, development workflow, and coding patterns ([b945707](https://github.com/DeiAsPie/DeiAsPie.github.io/commit/b945707493191219e129d201917a2f907ebaa494))
* add content quality and image budget checks ([06f1d80](https://github.com/DeiAsPie/DeiAsPie.github.io/commit/06f1d80be804c1b734da694eeb3a4afc1badfc5f))
* Add focus-visible styles for skip link accessibility ([cde4ced](https://github.com/DeiAsPie/DeiAsPie.github.io/commit/cde4cede2021c696442dcb37faa174c0cef45e22))
* add images for BaseCS Season One and Season Two course recommendations ([9850c32](https://github.com/DeiAsPie/DeiAsPie.github.io/commit/9850c32592a53c45d367c5e9f2c71f595891a5e0))
* Add pre-commit hook and scripts to detect forbidden literals in HTML/HTM files ([7448c40](https://github.com/DeiAsPie/DeiAsPie.github.io/commit/7448c40a961060c5c0de68f286145d4f30d5a0f0))
* add release-please for automated changelog and versioning ([99888f8](https://github.com/DeiAsPie/DeiAsPie.github.io/commit/99888f86849c4aa56798601b353e78a20e2e84d6))
* Add render hooks for Markdown images and links ([85ccc71](https://github.com/DeiAsPie/DeiAsPie.github.io/commit/85ccc714fd91b8a9ec674552c012caa78af151f6))
* Add Signal QR code for easy contact and update connection methods ([9980781](https://github.com/DeiAsPie/DeiAsPie.github.io/commit/9980781335d32abaaeb275995ba15c762b550800))
* add structured data for SEO and improve accessibility features ([62db783](https://github.com/DeiAsPie/DeiAsPie.github.io/commit/62db783c8fbd775e0f81d2a867880b131326abdf))
* Add unit test for detecting forbidden literals in HTML templates ([5882198](https://github.com/DeiAsPie/DeiAsPie.github.io/commit/58821985f56599757323b715c037e72220d6d5d5))
* Add VSCode settings to disable format on save for HTML files ([c6b6830](https://github.com/DeiAsPie/DeiAsPie.github.io/commit/c6b6830a52c07629684355d6c24b6e90f671e2fe))
* Enhance "Connect With Me" section with improved layout and additional links ([e274ec9](https://github.com/DeiAsPie/DeiAsPie.github.io/commit/e274ec9e9fb9857141535a344d56b0409afac4a2))
* enhance README and configuration for improved performance and security ([09be01d](https://github.com/DeiAsPie/DeiAsPie.github.io/commit/09be01d4c6ced1c5bd381f0f6615b2e9fcec6e3d))
* implement industry best practices and fix CI issues ([a975b75](https://github.com/DeiAsPie/DeiAsPie.github.io/commit/a975b75d71e6937e6fd3d55bc1c5252b61c8d26c))
* implement responsive card layout for recommendations and courses ([62db783](https://github.com/DeiAsPie/DeiAsPie.github.io/commit/62db783c8fbd775e0f81d2a867880b131326abdf))
* Integrate Playwright and axe-core for enhanced accessibility testing in CI ([d3ffd09](https://github.com/DeiAsPie/DeiAsPie.github.io/commit/d3ffd09856b0baf89e4a53a23c4a2c5a73db4a92))
* unregister service worker and clear caches on load ([62db783](https://github.com/DeiAsPie/DeiAsPie.github.io/commit/62db783c8fbd775e0f81d2a867880b131326abdf))


### Bug Fixes

* add missing date frontmatter and skip Hugo template links in linter ([c67a775](https://github.com/DeiAsPie/DeiAsPie.github.io/commit/c67a775e81aed76ce428c7d8a054250c7afc96bd))
* Add width and height attributes to image for better layout stability ([9e0f484](https://github.com/DeiAsPie/DeiAsPie.github.io/commit/9e0f4844c4ff7b2c90495e4044e2f9f93bc3e3df))
* allow Playwright to reuse existing Hugo server in CI ([82bcf3d](https://github.com/DeiAsPie/DeiAsPie.github.io/commit/82bcf3dfee2ceab44e44164a57925a37b3acff72))
* complete mobile menu setupMobileMenu function with event listeners ([a7aa715](https://github.com/DeiAsPie/DeiAsPie.github.io/commit/a7aa71551c0fd202635af3f4e037e90d46537787))
* Correct whitespace in favicon link paths in head.html ([9ec8b03](https://github.com/DeiAsPie/DeiAsPie.github.io/commit/9ec8b037b3b5c830638b73b3066939742fa4dc76))
* Enable bypassing CSP in new browser context for improved AXE testing ([9c5a3a2](https://github.com/DeiAsPie/DeiAsPie.github.io/commit/9c5a3a20b2988f74ea237dd188d7ea88d277e8b1))
* Ensure explicit font-size for headings to avoid Lighthouse warnings and maintain visual consistency ([e91e2e8](https://github.com/DeiAsPie/DeiAsPie.github.io/commit/e91e2e8b2b9dad9eca1a67cb67034fd301eedf3d))
* export getBudgetForBundle function from check_image_budgets module ([23aa316](https://github.com/DeiAsPie/DeiAsPie.github.io/commit/23aa31695299f6800fa03ec1c5ca41b31ae9a1cb))
* Improve CSS size computation in CI workflow ([820de33](https://github.com/DeiAsPie/DeiAsPie.github.io/commit/820de3352e3fd2c815311cbb2fd77b577aac32b6))
* kill existing Hugo server before starting Playwright tests ([aaff4e6](https://github.com/DeiAsPie/DeiAsPie.github.io/commit/aaff4e6d2b5b2b277983576e789ee83d2da5530b))
* kill http-server and hugo before Playwright tests ([786ef82](https://github.com/DeiAsPie/DeiAsPie.github.io/commit/786ef823d8df47d11e04d46b3ed58ea8137b36f0))
* kill http-server before Playwright tests to avoid port conflict ([cff8771](https://github.com/DeiAsPie/DeiAsPie.github.io/commit/cff87712317c6c61594d401b7f81b50f3ae7cac1))
* remove AVIF srcset generation for Hugo v0.157.0 compatibility ([f80321a](https://github.com/DeiAsPie/DeiAsPie.github.io/commit/f80321a65c0b6abc69107f9a6dbf36db9675f6be))
* Remove deprecated report-uri from CSP and add explicit font-size for headings ([137686b](https://github.com/DeiAsPie/DeiAsPie.github.io/commit/137686bb2c964d00c757c553531200284f6b6963))
* Remove quotation marks from privacy quotes for consistency ([43a02bb](https://github.com/DeiAsPie/DeiAsPie.github.io/commit/43a02bb6a573295141165e6e7a6681a0bda1a7c1))
* Remove redundant "Build site (Hugo)" task from VSCode tasks configuration ([9e06e97](https://github.com/DeiAsPie/DeiAsPie.github.io/commit/9e06e97d016d30fc5a58c136cc48f6489463807d))
* Update card image handling to use 'with' for webp source ([5567f07](https://github.com/DeiAsPie/DeiAsPie.github.io/commit/5567f07414195de35728be9705a151ef99aeb20b))
* Update categories for Proton Authenticator recommendation ([0ec53df](https://github.com/DeiAsPie/DeiAsPie.github.io/commit/0ec53dfaec297928371483aa8afdb30919012e1e))
* Update dates, categories, and tags for Proton Authenticator and Proton Pass recommendations ([b6237aa](https://github.com/DeiAsPie/DeiAsPie.github.io/commit/b6237aa680defdd9fb75c2ba0af92d0b4efcc2e0))
* Update development server command to disable fast rendering ([a8035e5](https://github.com/DeiAsPie/DeiAsPie.github.io/commit/a8035e514fe593e7dc42b303a5b09a4869341d5a))
* Update Python version in CI configuration from 3.11 to 3.12 ([b54d8d5](https://github.com/DeiAsPie/DeiAsPie.github.io/commit/b54d8d5f1f4a212fefb27b8e4c738303a8917aa5))
* use lsof to kill port 8080 instead of pkill regex ([83f7e8c](https://github.com/DeiAsPie/DeiAsPie.github.io/commit/83f7e8c4f1797885e353776136c688989a299dfa))
* use lsof to reliably kill process on port 8080 before Playwright tests ([5a70f16](https://github.com/DeiAsPie/DeiAsPie.github.io/commit/5a70f16ced886f4e88c4d5634aac31c787807062))


### Documentation

* add comprehensive CI fix and industry best practices documentation ([8c6bba7](https://github.com/DeiAsPie/DeiAsPie.github.io/commit/8c6bba717c887c0c2e8138fc38a0ebfb56b8d278))
* update BaseCS course recommendation images for season one and two. ([8420080](https://github.com/DeiAsPie/DeiAsPie.github.io/commit/8420080ef942f6aa1ac3ff274d7e59f41e73bf01))


### Miscellaneous Chores

* **deps-dev:** bump @tailwindcss/cli from 4.1.13 to 4.1.16 ([1d20e74](https://github.com/DeiAsPie/DeiAsPie.github.io/commit/1d20e743580f3bf42c57795ee06ea698f47bbffb))
* **deps-dev:** bump axe-core from 4.10.3 to 4.11.0 ([f025744](https://github.com/DeiAsPie/DeiAsPie.github.io/commit/f025744574bd80fd5d3086fc98682d2f09d40cb3))
* **deps-dev:** bump js-yaml ([9fc454d](https://github.com/DeiAsPie/DeiAsPie.github.io/commit/9fc454d1c59c45aae3f3806f02743ba89dbe8ee1))
* **deps:** bump tar in the npm_and_yarn group across 1 directory ([a2be83f](https://github.com/DeiAsPie/DeiAsPie.github.io/commit/a2be83f02ce6264cc52d38978c5f525e04feeaae))
* Remove HTML formatting settings from VSCode configuration ([3b914f6](https://github.com/DeiAsPie/DeiAsPie.github.io/commit/3b914f6376a929170b0e14af6f3a3786ce2ce699))
* remove outdated gap analysis and improvement documentation files ([fa97f70](https://github.com/DeiAsPie/DeiAsPie.github.io/commit/fa97f701fa0db8276525ab0b0b6666d21144a72f))
* remove unused scripts and service worker files ([62db783](https://github.com/DeiAsPie/DeiAsPie.github.io/commit/62db783c8fbd775e0f81d2a867880b131326abdf))
* Update CI workflow to use Python 3.13. ([b317245](https://github.com/DeiAsPie/DeiAsPie.github.io/commit/b317245fd6df110d320c67464d3127df0d66af4f))
* Update package name and bump Tailwind CSS dependencies to version 4.1.13 ([17a6cb8](https://github.com/DeiAsPie/DeiAsPie.github.io/commit/17a6cb8c8839609f7eb2fbfb846b19b8a17ab21f))
* update service worker tracking issue link in sw-register.js ([399f9a2](https://github.com/DeiAsPie/DeiAsPie.github.io/commit/399f9a259f4f894962395e771e545e3cfcf11917))
* update Tailwind CSS setup and dependencies ([b1338a3](https://github.com/DeiAsPie/DeiAsPie.github.io/commit/b1338a3953c911afdcf9a18df2f9e2c4ccedacf6))
* Update various images and clean up SVG assets. ([2d4fa75](https://github.com/DeiAsPie/DeiAsPie.github.io/commit/2d4fa75f058df3f21233000888f8c691881ee8b0))
* update various static image assets across the website. ([fb6323f](https://github.com/DeiAsPie/DeiAsPie.github.io/commit/fb6323f312167ee2238c260c3f757b519260f7b8))
* Upgrade dependencies and improve code formatting across various files ([d7f15a0](https://github.com/DeiAsPie/DeiAsPie.github.io/commit/d7f15a0805079a0a146c863f28d9e2119ad7325c))
