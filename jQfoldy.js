/*
This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

$.fn.depth = function() {
    if (this.get(0).tagName == "OL") {
        return $(this.children("li")[0]).depth();
    }
    if (this.get(0).tagName != "LI") {
        return $(this.parents("li")[0]).depth();
    }
    return this.parents("ol").length - 1;
};

$.fn.isOpen = function() {
    return this.attr("compact") !== "compact";
};

$.keys = {
    KEY_BACKSPACE: 8,
    KEY_TAB: 9,
    KEY_RETURN: 13,
    KEY_ESC: 27,
    KEY_LEFT: 37,
    KEY_UP: 38,
    KEY_RIGHT: 39,
    KEY_DOWN: 40,
    KEY_DELETE: 46,
    KEY_HOME: 36,
    KEY_END: 35,
    KEY_PAGEUP: 33,
    KEY_PAGEDOWN: 34,
    KEY_INSERT: 45
};

var Foldy = {
    focused: null,

    blur: function() {
        var txted = $("#txted");
        var newval = $.trim(txted.val());
        var thehed = txted.parent("span");
        thehed.html(newval + "&nbsp;&nbsp;&nbsp;");
        if (window.hoisted) {
            Foldy.updateHoisted();
        }
        Foldy.save();
        Foldy.focused = null;
    },

    /* basic handlers that route stuff around */

    handleClick: function(txtspan) {
        var self = $(txtspan);
        if (Foldy.focused != self) {
            if (Foldy.focused) {
                Foldy.blur();
            }
            Foldy.focused = self;

            var editval = $.trim(self.text());
            self
                .empty()
                .append(
                    "<textarea id='txted' tabindex='-1' wrap='virtual'>" +
                    editval +
                    "</textarea>"
                );

            var txted = $("#txted");
            var thewidth = $(window).width() - txted.offset().left;
            txted.Autoexpand([thewidth, 300]);
            txted.get(0).focus();
        }
        return false;
    },

    handleReturn: function(event, txted) {
        if (!event.shiftKey) {
            event.preventDefault();
            if (event.target.selectionStart === event.target.textLength) {
                Foldy.createAfter(txted, { focus: true });
            } else {
                var newText = event.target.value.substr(
                    event.target.selectionStart,
                    event.target.textLength
                );
                event.target.value = event.target.value.substr(0, event.target.selectionStart);
                Foldy.createAfter(txted, {
                    focus: true,
                    text: newText
                });
            }
        } else {
            if (event.ctrlKey) {
                Foldy.hoist($(txted.parents('li')[0])); // ugh
            }
        }
    },

    handleTab: function(event, jqTxted) {
        event.preventDefault();
        var jqHeading = $(jqTxted.parents("li")[0]);
        if (event.shiftKey) {
            Foldy.outdent(jqHeading);
        } else {
            Foldy.indent(jqHeading);
        }
    },

    handleArrow: function(event, jqTxted) {
        if (event.shiftKey) {
            event.stopPropagation();
            var jqHeading = $(jqTxted.parents("li")[0]);
            if (event.ctrlKey) {
                event.preventDefault();
                switch (event.keyCode) {
                    case $.keys.KEY_UP:
                        Foldy.haul(jqHeading, -1);
                        break;

                    case $.keys.KEY_DOWN:
                        Foldy.haul(jqHeading, 1);
                        break;

                    case $.keys.KEY_LEFT:
                        Foldy.collapse(jqHeading);
                        break;

                    case $.keys.KEY_RIGHT:
                        Foldy.expand(jqHeading);
                        break;
                }
            } else {
                var dest = null;
                switch (event.keyCode) {
                    case $.keys.KEY_UP:
                        event.preventDefault();
                        dest = Foldy.findVisiblePrev(jqHeading);
                        break;

                    case $.keys.KEY_DOWN:
                        event.preventDefault();
                        dest = Foldy.findVisibleNext(jqHeading);
                        break;
                }

                if (dest != null) {
                    console.log('jump', jqHeading, dest);
                    Foldy.handleClick($(dest).find("span.txt")[0]);
                }
            }
        }
    },

    handleBackspace: function(event, jqTxted) {
        if (jqTxted.val() == "") {
            var jqHeading = $(jqTxted.parents("li")[0]);
            if (jqHeading.hasClass("emptied")) {
                Foldy.destroyHeading(jqHeading);
            } else {
                jqHeading.addClass("emptied");
            }
        }
    },

    /* expand/collapse related */

    expand: function(jqHed) {
        Foldy.redrawFlipper(jqHed.removeAttr("compact"));
    },

    collapse: function(jqHed) {
        Foldy.redrawFlipper(jqHed.attr("compact", "compact"));
    },

    redrawFlipper: function(jqHed) {
        var jqFlip = $(jqHed.find("span.flip")[0]);
        var stillhaskids = jqHed.find("ol").children().length;
        if (stillhaskids && jqHed.isOpen()) {
            // draw down arrow
            jqFlip.removeClass("in").removeClass("dim").addClass("down");
        } else if (stillhaskids) {
            // draw in arrow
            jqFlip.removeClass("down").removeClass("dim").addClass("in");
        } else {
            // draw dimmed arrow
            jqFlip.removeClass("in").removeClass("down").addClass("dim");
        }
    },

    /* create, move, and destroy headings */

    newHeading:
        "<li><span class='flip dim' draggable='true'></span><span class='txt'>&nbsp;&nbsp;&nbsp;</span></li>",

    createAfter: function(txted, options) {
        var jqTarget = $(txted.parents("li")[0]);
        if (jqTarget.isOpen() && jqTarget.children("li").length) {
            $(Foldy.newHeading).insertBefore(jqTarget.children("li")[0]);
            if (options.focus) {
                Foldy.blur();
                var $newBoy = jqTarget.children("li").find("span.txt");
                $newBoy.text(options.text || '');
                Foldy.handleClick($newBoy[0]);
            }
        } else {
            $(Foldy.newHeading).insertAfter(jqTarget);
            if (options.focus) {
                Foldy.blur();
                var $newBoy = jqTarget.next("li").find("span.txt");
                $newBoy.text(options.text || '');
                Foldy.handleClick($newBoy[0]);
            }
        }
    },

    haul: function(jqHed, direction) {
        console.log('haul',jqHed,direction);
        if (direction > 0 && jqHed.next().length) {
            // down
            jqHed.next().after(jqHed);
        } else if (direction < 0 && jqHed.prev().length) {
            jqHed.prev().before(jqHed);
        }
        Foldy.handleClick(jqHed.find("span.txt")[0]);
    },

    indent: function(jqHed) {
        var prior = jqHed.prev("li");
        if (prior.length) {
            if (!prior.isOpen()) {
                Foldy.toggleOpen(prior, true);
            }
            var otherkids = prior.children("ol:first");
            if (otherkids.length) {
                jqHed.appendTo(otherkids);
            } else {
                var newOl = $("<ol></ol>");
                newOl.appendTo(prior);
                newOl.append(jqHed);
            }
            Foldy.redrawFlipper(prior);
            Foldy.handleClick(jqHed.find("span.txt")[0]);
        }
    },

    outdent: function(jqHed) {
        var oldparent = jqHed.parents("li")[0];
        if (oldparent) {
            Foldy.blur();
            if (jqHed.next().length) {
                // parent has other kids after this one
                // they're our kids now!
                jqHed.isOpen(true); // force it open
                // do we have an OL already? better get one
                if (!jqHed.children("ol:first").length) {
                    jqHed.append("<ol></ol>");
                }
                // finally
                while (jqHed.next().length) {
                    jqHed.next().appendTo(jqHed.children("ol:first"));
                }
            }
            // now that we have the kids, flee
            var op = $(oldparent);
            op.after(jqHed);
            Foldy.redrawFlipper(op);
            Foldy.redrawFlipper(jqHed);
            Foldy.handleClick(jqHed.find("span.txt")[0]);
        }
    },

    toggleOpen: function(jqHed, openFlag) {
        if (openFlag) {
            jqHed.addClass("open").removeAttr("compact");
        } else {
            jqHed.removeClass("open").attr("compact", "compact");
        }
        Foldy.redrawFlipper(jqHed);
    },

    destroyHeading: function(jqHeading) {
        // figure out where the prior heading is
        var jqPrev = Foldy.findVisiblePrev(jqHeading);
        // focus it
        if (jqPrev != null) {
            Foldy.handleClick($(jqPrev).find("span.txt")[0]);
            var jqParentlist = jqHeading.parent("ol");
            var jqSavedBabies = jqHeading.children("ol");

            // first, get the kids out
            if (jqSavedBabies.length) {
                if (
                    jqPrev.depth() >= $(jqSavedBabies.children("li")[0]).depth()
                ) {
                    jqSavedBabies.children("li").each(function() {
                        $(this).appendTo(jqPrev.parent());
                    });
                } else {
                    if (jqPrev.find("ol").length) {
                        jqSavedBabies.children("li").each(function() {
                            jqPrev.find("ol").append(this);
                        });
                    } else {
                        jqPrev.find("ol").append(jqSavedBabies);
                    }
                }
            }

            jqHeading.remove();
            if (jqParentlist.children("li").length == 0) {
                jqParentlist.remove();
                //redraw flippy on list's parent li
            }

            Foldy.redrawFlipper(jqPrev);
        }
    },

    hoist: function(jqHeading) {
        if (!window.hoisted) {
            if (!jqHeading.children('ol').length) {
                jqHeading.append($('<ol></ol>'));
            }
            $('ol.xoxo').hide();
            $('ol.hoist').html(jqHeading.children('ol')[0].innerHTML);
            $('ol.hoist').show();
            $('h2.hoisted').html(jqHeading.find('#txted').val()).show();
            Foldy.handleClick($('ol.hoist').find('span.txt')[0]);
            window.hoisted = jqHeading;
        }
    },

    unhoist: function() {
        if (window.hoisted) {
            $('ol.hoist').hide();
            $('h2.hoisted').hide();
            $('ol.xoxo').show();
            // click some hed somewhere somehow
            Foldy.handleClick($('ol.xoxo').find('span.txt')[0]);
            // and Finally
            delete window.hoisted;
        }
    },

    updateHoisted: function() {
        var destOL = $(window.hoisted).find('ol');
        $(destOL).html($('ol.hoist').html());
    },

    /* traversal helpers */

    findVisiblePrev: function(jqHeading) {
        var visibleprev = null;
        var prevthis = null;
        var topList = window.hoisted ? $('ol.hoist') : $('ol.xoxo');
        topList.find("li").each(function() {
            if ($($(this).parents("li")[0]).isOpen()) {
                if ($(this).find("textarea").length) {
                    visibleprev = prevthis;
                }
                prevthis = this;
            }
        });
        return $(visibleprev);
    },

    findVisibleNext: function(jqHeading) {
        var visiblenext = null;
        var prevthis = null;
        var topList = window.hoisted ? $('ol.hoist') : $('ol.xoxo');
        topList.find("li").each(function() {
            if ($($(this).parents("li")[0]).isOpen()) {
                if ($(prevthis).find("textarea").length) {
                    visiblenext = this;
                }
                prevthis = this;
            }
        });
        return $(visiblenext);
    },

    /* IO, IO, it's off to work we go */

    save: function() {
        if (window.DatArchive) {
            var archive = new DatArchive(window.location.href.toString());
            return archive.writeFile('index.html',
                '<!doctype html><html>' + document.documentElement.innerHTML + '</html>'
            );
        }
    }
};

/* finally, time to hook in */

var dragging = null;

$(function() {
    $.listen("span.txt", "click", function() {
        Foldy.handleClick(this);
    });

    $.listen("span.txt", "dragover", function(event) {
        if (event.offsetY < (event.target.offsetHeight / 2)) {
            $($(this).parents("li")[0]).removeClass('bottomDrag').addClass('topDrag');
        } else {
            $($(this).parents("li")[0]).removeClass('topDrag').addClass('bottomDrag');
        }
    })
    $.listen("ol li", "dragover", function(event) {
        if (event.offsetY < (event.target.offsetHeight / 2)) {
            $(this).removeClass('bottomDrag').addClass('topDrag');
        } else {
            $(this).removeClass('topDrag').addClass('bottomDrag');
        }
    });
    $.listen("ol li", "dragleave", function() {
        $(this).removeClass('bottomDrag').removeClass('topDrag');
    });

    $.listen("span.flip", "dragstart", function() {
        event.dataTransfer.setData('text/html', $(this).parents("li")[0].innerHTML);
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.dropEffect = 'move';
        dragging = $(this).parents("li")[0];
        console.log(dragging);
    });
    $.listen("ol li, span.txt", "drop", function(event) {
        console.log('drop');
        // if (event.stopPropagation) {
        //     event.stopPropagation();
        // }
        console.log(event.offsetY < (event.target.offsetHeight / 2) ? 'top' : 'bottom');
        console.log(event.dataTransfer.getData('text/html'));
        return false;
    });
    $.listen("span.flip", "dragend", function() {
        // debugger; // to find an incidental target hopefully
        dragging = null;
        $("ol li").removeClass('bottomDrag').removeClass('topDrag');
        console.log('dragend going off');
    });

    $.listen("#txted", "keydown", function(event) {
        var jqTxted = $(this);
        var keyHandlers = {};
        switch (event.keyCode) {
            case $.keys.KEY_RETURN:
                Foldy.handleReturn(event, jqTxted);
                break;

            case $.keys.KEY_TAB:
                Foldy.handleTab(event, jqTxted);
                event.preventDefault();
                break;

            case $.keys.KEY_UP:
            case $.keys.KEY_DOWN:
            case $.keys.KEY_LEFT:
            case $.keys.KEY_RIGHT:
                Foldy.handleArrow(event, jqTxted);
                break;

            case $.keys.KEY_BACKSPACE:
                Foldy.handleBackspace(event, jqTxted);
                break;

            case $.keys.KEY_ESC:
                Foldy.unhoist();
                break;

            default:
                $(jqTxted.parents("li")[0]).removeClass("emptied");
        }
    });

    $.listen("ol li span.flip", "click", function(event) {
        var jqHed = $($(this).parents("li")[0]);
        var flag = jqHed.isOpen();
        Foldy.toggleOpen(jqHed, !flag);
    });

    $.listen('div#toolbar li.help', "click", function() {
        $('#haalp').toggle();
    });
    $.listen('#haalp', "click", function() {
        $('#haalp').hide();
    });

});
