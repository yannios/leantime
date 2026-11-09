/**
 * Flat theme — the two behaviours a stylesheet cannot express.
 *
 * 1. Timeline (Gantt) geometry.
 *
 * Row height in the timeline is not a CSS value: frappe-gantt computes
 * `bar_height + padding` in JS and writes it into the SVG as y/height
 * attributes, so no stylesheet can make the rows shorter. The theme therefore
 * patches the class once, before Leantime builds the chart, and pins the three
 * numbers that decide the geometry:
 *
 *   bar_height        40 -> 24   bar thickness
 *   padding           20 -> 20   gap under each bar (row pitch = bar + padding = 44)
 *   bar_corner_radius 10 ->  2   corner rounding of the bars
 *
 * `padding` is deliberately left at 20: the chart starts its first row at
 * `header_height + padding / 2` while the sticky header rect is
 * `header_height + 10` tall. Any padding below 20 puts the first milestone
 * underneath that header, which reads as a clipped first row.
 *
 * Everything else (bar colour, grid, today marker) still comes from
 * gantt-overwrites.css. Delete this file to fall back to Leantime's defaults.
 *
 * The filename matters: Theme::getJsUrl() resolves js/theme.js (or theme.min.js)
 * from the active theme — DEFAULT_JS is "theme", not "default".
 */
(function () {
    'use strict';

    var FLAT = {
        bar_height: 24,
        padding: 20,
        bar_corner_radius: 2
    };

    function patch() {
        var Gantt = window.Gantt;

        if (!Gantt || !Gantt.prototype || !Gantt.prototype.setup_options) {
            return false;
        }

        if (Gantt.prototype.__flatPatched) {
            return true;
        }

        var original = Gantt.prototype.setup_options;

        Gantt.prototype.setup_options = function (options) {
            options = options || {};

            for (var key in FLAT) {
                if (Object.prototype.hasOwnProperty.call(FLAT, key)) {
                    options[key] = FLAT[key];
                }
            }

            return original.call(this, options);
        };

        Gantt.prototype.__flatPatched = true;

        return true;
    }

    if (!patch()) {
        // The Gantt bundle may run after this file (deferred), and by then
        // Leantime has already built the chart. Catch the assignment itself so
        // the class is wrapped before the first `new Gantt(...)`.
        var current;

        try {
            Object.defineProperty(window, 'Gantt', {
                configurable: true,
                get: function () {
                    return current;
                },
                set: function (value) {
                    current = value;
                    patch();
                }
            });
        } catch (e) {
            // Non-configurable global: last resort, patch once the DOM is ready.
            document.addEventListener('DOMContentLoaded', patch);
        }
    }
})();

/**
 * 2. "Clear all filters" button in the filter panel.
 *
 * The filter panel is one plain GET form (#ticketSearch) whose fields all live
 * in the query string, so clearing is a navigation back to the same path without
 * it. The button is only rendered visible by CSS when the panel shows a filter
 * badge; here it just has to exist in the DOM, next to the Search button.
 */
(function () {
    'use strict';

    function clearLabel() {
        try {
            var t = window.leantime && window.leantime.i18n && window.leantime.i18n.__('buttons.clear');

            if (t && t !== 'buttons.clear') {
                return t;
            }
        } catch (e) {
            // i18n not ready: fall through to the Croatian default.
        }

        return 'Očisti';
    }

    function inject() {
        var form = document.getElementById('ticketSearch');

        if (!form || form.querySelector('.flat-clear-filters')) {
            return;
        }

        var submit = form.querySelector('input[type="submit"], button[type="submit"]');
        var host = submit && submit.parentNode ? submit.parentNode : form;

        var link = document.createElement('a');
        link.className = 'flat-clear-filters';
        link.href = window.location.pathname;
        link.textContent = clearLabel();

        host.appendChild(link);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', inject);
    } else {
        inject();
    }

    // Leantime swaps content with htmx and re-runs pages through soft reloads.
    document.addEventListener('htmx:afterSwap', inject);
    document.addEventListener('lt:softReload', inject);
})();

/**
 * 3. Tag criterion in the filter panel.
 *
 * Leantime builds the filter URL in JS (ticketsController.initTicketSearchSubmit)
 * from a fixed field list, so a new field is invisible to it. When the tag field
 * has a value this handler takes the submit over (capture phase, before the
 * bundled handler) and rebuilds the same query with tags added; with an empty
 * tag field it stays out of the way entirely.
 */
(function () {
    'use strict';

    // [query name, selector] — mirrors ticketsController.initTicketSearchSubmit.
    var FIELDS = [
        ['projectId', '#projectIdInput'],
        ['users', '#userSelect'],
        ['milestone', '#milestoneSelect'],
        ['term', '#termInput'],
        ['sprint', '#sprintSelect'],
        ['type', '#typeSelect'],
        ['priority', '#prioritySelect'],
        ['status', '#statusSelect'],
        ['projects', '#projectsSelect'],
        ['sort', '#sortBySelect'],
        ['groupBy', "input[name='groupBy']:checked"],
        ['showTasks', "input[name='showTasks']:checked"],
        ['tags', '[name="tags"]']
    ];

    function buildUrl(jQuery) {
        var parts = ['search=true'];

        for (var i = 0; i < FIELDS.length; i++) {
            var name = FIELDS[i][0];
            var el = jQuery(FIELDS[i][1]);
            var value = el.val();

            if (value === null || value === undefined || value === '' || value.length === 0) {
                continue;
            }

            parts.push(encodeURIComponent(name) + '=' + encodeURIComponent(String(value)));
        }

        return window.location.pathname + '?' + parts.join('&');
    }

    function install() {
        var form = document.getElementById('ticketSearch');

        if (!form || form.dataset.flatTagsBound === '1' || !form.querySelector('[name="tags"]')) {
            return;
        }

        form.dataset.flatTagsBound = '1';

        form.addEventListener('submit', function (event) {
            var field = form.querySelector('[name="tags"]');

            if (!field || String(field.value || '').trim() === '' || !window.jQuery) {
                return; // nothing to add: the bundled handler builds the URL
            }

            event.preventDefault();
            event.stopImmediatePropagation();

            window.location.href = buildUrl(window.jQuery);
        }, true);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', install);
    } else {
        install();
    }

    document.addEventListener('htmx:afterSwap', install);

    // Exposed for debugging and for the theme's own tests.
    window.leantimeFlat = window.leantimeFlat || {};
    window.leantimeFlat.ticketSearchUrl = function () {
        return window.jQuery ? buildUrl(window.jQuery) : '';
    };
})();

/**
 * Kanban: a title-only board.
 *
 * Leantime already knows how to hide card fields - the "Polja kartice" toggles in
 * the view menu post to /hx/tickets/kanbanView/save and the board re-renders with
 * only the checked ones. This adds a single button that does the same thing in one
 * click: it clears every box and saves, so what is left of a card is its headline.
 *
 * The selection is remembered, so the second click puts the fields back as they
 * were. Two leftovers the field list does not cover - the type/#id line and the
 * per-card "..." menu - are hidden by the stylesheet under
 * body.flat-cards-titles-only, which is set whenever the board reports no fields.
 */
(function () {
    'use strict';

    var CLASS = 'flat-cards-titles-only';
    var KEY = 'leantimeFlat.cardFields';
    var LABEL_OFF = 'Sakrij detalje kartica';
    var LABEL_ON = 'Prikaži detalje kartica';

    function boxes() {
        return [].slice.call(document.querySelectorAll('.kanbanViewMenu input[name="fields[]"]'));
    }

    function remember() {
        var on = boxes().filter(function (b) { return b.checked; }).map(function (b) { return b.value; });

        try {
            if (on.length > 0) {
                window.localStorage.setItem(KEY, JSON.stringify(on));
            }
        } catch (e) {
            /* private mode */
        }

        return on;
    }

    function recalled() {
        try {
            var raw = window.localStorage.getItem(KEY);
            var list = raw ? JSON.parse(raw) : [];

            return Array.isArray(list) ? list : [];
        } catch (e) {
            return [];
        }
    }

    function paint(btn) {
        var all = boxes();
        var shown = all.filter(function (b) { return b.checked; }).length;
        var empty = all.length > 0 && shown === 0;

        document.body.classList.toggle(CLASS, empty);
        btn.classList.toggle('active', empty);
        btn.setAttribute('aria-pressed', empty ? 'true' : 'false');
        btn.setAttribute('title', empty ? LABEL_ON : LABEL_OFF);
        btn.setAttribute('data-tippy-content', empty ? LABEL_ON : LABEL_OFF);
    }

    function save() {
        var form = document.querySelector('.kanbanViewMenu form[hx-post], .kanbanViewMenu form');

        if (!form) {
            return;
        }

        if (window.htmx && typeof window.htmx.trigger === 'function') {
            window.htmx.trigger(form, 'submit');
        } else if (typeof form.requestSubmit === 'function') {
            form.requestSubmit();
        } else {
            form.submit();
        }
    }

    function install() {
        var anchor = document.querySelector('.kanbanViewMenu');

        if (!anchor) {
            return; // not the board
        }

        var btn = document.getElementById('flatCardsToggle');

        if (!btn) {
            btn = document.createElement('a');
            btn.id = 'flatCardsToggle';
            btn.className = 'btn-link flat-cards-toggle';
            btn.href = 'javascript:void(0);';
            btn.innerHTML = '<span class="lt-ico lt-ico-unfold-vertical"></span>';

            var actions = document.querySelector('.lt-tabs-actions');
            if (actions) {
                actions.insertBefore(btn, anchor.parentNode.matches('.lt-tabs-actions') ? anchor : anchor.parentNode);
            } else {
                anchor.parentNode.insertBefore(btn, anchor.nextSibling);
            }

            btn.addEventListener('click', function (event) {
                event.preventDefault();

                var all = boxes();

                if (all.length === 0) {
                    return;
                }

                var anyChecked = all.some(function (b) { return b.checked; });

                if (anyChecked) {
                    remember();
                    all.forEach(function (b) { b.checked = false; });
                } else {
                    var back = recalled();

                    all.forEach(function (b) { b.checked = back.indexOf(b.value) !== -1; });

                    if (!all.some(function (b) { return b.checked; })) {
                        all.forEach(function (b) { b.checked = true; });
                    }
                }

                paint(btn);
                save();
            });
        }

        paint(btn);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', install);
    } else {
        install();
    }

    document.addEventListener('htmx:afterSwap', install);
})();
