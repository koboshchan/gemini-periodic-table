Gemini Model Periodic Table

A Tampermonkey userscript that replaces Gemini's model picker with a periodic table. H is Hydrogen, C is Carbon, Ne is Neon, and Ar is Argon, all Gemini 4 models.

Locked models and models missing from your account's menu are striped and unclickable. This changes the picker, not your account's access.

Install [Tampermonkey](https://www.tampermonkey.net/), then open the [userscript install link](https://raw.githubusercontent.com/koboshchan/gemini-periodic-table/main/gemini-periodic-table.user.js) and accept the installation. Reload [Gemini](https://gemini.google.com/) if it's already open.

Click the usual model picker to open the table, then click an available model. Click outside the table or press Escape to close it. The other elements are placeholders.

The script checks Gemini's own menu each time you open the table and clicks the real menu item when you choose a model. It builds the interface with DOM methods rather than HTML strings, so it works with Gemini's Trusted Types restrictions.

It relies on Gemini's current DOM, especially the picker button's `data-test-id="bard-mode-menu-button"`. A Gemini update may break it. If the menu can't be read, model selection stays disabled. Model availability depends on your account.

Licensed under [MIT](LICENSE).
