/**
 * Flat theme — timeline (Gantt) tuning.
 *
 * Row height in the timeline is not a CSS value: frappe-gantt computes
 * `bar_height + padding` in JS and writes it into the SVG as y/height
 * attributes, so no stylesheet can make the rows shorter. The theme therefore
 * patches the class once, before Leantime builds the chart, and pins the three
 * numbers that decide the geometry:
 *
 *   bar_height        40 -> 26   bar thickness
 *   padding           20 ->  4   gap under each bar (row pitch = bar + padding)
 *   bar_corner_radius 10 ->  2   corner rounding of the bars
 *
 * Everything else (bar colour, grid, today marker) still comes from
 * gantt-overwrites.css. Delete this file to fall back to Leantime's defaults.
 */
(function () {
    'use strict';

    var FLAT = {
        bar_height: 26,
        padding: 4,
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
