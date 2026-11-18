# Gemini Model Periodic Table

A [Tampermonkey](https://www.tampermonkey.net/) userscript that turns Gemini's model picker into a periodic table.

**[Install the userscript](https://raw.githubusercontent.com/koboshchan/gemini-periodic-table/main/gemini-periodic-table.user.js)**

Open the usual model picker to choose a Gemini 4 model by its element. Locked models and models missing from your account's menu are striped and unclickable.

| Element | Model |
| --- | --- |
| H | Hydrogen |
| C | Carbon |
| Ne | Neon |
| Ar | Argon |

The remaining elements are placeholders.

## Install

1. Install [Tampermonkey](https://www.tampermonkey.net/) in your browser.
2. Open the [raw userscript link](https://raw.githubusercontent.com/koboshchan/gemini-periodic-table/main/gemini-periodic-table.user.js) and confirm installation in Tampermonkey.
3. Open or reload [Gemini](https://gemini.google.com/).

The script includes update and download URLs pointing to this repository, so Tampermonkey can pick up new versions when automatic updates are enabled.

## Use

Click Gemini's model picker, then select an available element. Click outside the table, use its close button, or press Escape to dismiss it.

The script checks Gemini's own menu each time you open the table. Choosing an element clicks the corresponding real menu item.

> [!NOTE]
> This changes the picker, not your account's access. It does not unlock models or bypass subscription restrictions.

## How it works

The interface is built with DOM methods and text nodes rather than HTML strings, avoiding Gemini's Trusted Types restrictions.

There is no build step. The userscript lives in [gemini-periodic-table.user.js](gemini-periodic-table.user.js).

## Limitations

The script depends on Gemini's current DOM and menu labels, including the picker button's `data-test-id="bard-mode-menu-button"`. Changes to Gemini can break the table or availability detection. If the menu cannot be read, model selection stays disabled.

If something breaks, [open an issue](https://github.com/koboshchan/gemini-periodic-table/issues) with what happened and your browser and userscript version.

Released under the [MIT license](LICENSE).
