"use strict";

console.log(`Now you're cookin!`);

window.oodelalliPublishChanges = async (button) => {

	const buildHook = button.dataset.buildHook;

	if (!buildHook) {

		alert(`Sorry, there's no build hook set in the config.`);

		return;
	}

	if (!confirm(`Re-deploy the website with the changes you've made? Please wait until you're finished making changes for the day.`)) return false;

	const res = await fetch(buildHook, { method: "POST" });

	console.log(res.status);

	alert(`Okay, the site is re-deploying!`);

	/**
	 *  Try to prevent too many deploys
	 * - store last build time locally?
	 */
}