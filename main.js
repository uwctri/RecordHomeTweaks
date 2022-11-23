$(document).ready(() => {

    const config = ExternalModules.UWMadison.RecordHomeTweaks.config;

    const html = {
        alert: `
            <div class="alert alert-primary" role="alert" style="border-color:#b8daff!important;width:800px"> 
                ${config["record-alert"]}
            </div>`,
        table: (title, subtitle) => `
            <div id="sysManTable" class="table-responsive">
                <table class="table table-bordered sysManTable" style="background-color:#fcfef5;color:#000;width:max-content">
                    <tbody>
                        <tr>
                            <td id="eventReformatTitle" style="text-align:center;background-color:#FFFFE0" colspan="99">
                                <div class="evTitle font-weight-bold">${title}</div>
                                <div class="custom_event_label">${subtitle}</div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>`,
        td: (btn, name) => `
            <td class="nowrap" style="text-align:center;">${btn}
                <span style="margin-left:5px">${name}</span>
            </td>`,
        tabRow: `<div id="tabsRow" class="row"><ul class="nav nav-tabs" id="eventTabs"></ul></div>`,
        tab: (name) => `<li class="nav-item"><a class="nav-link" href="javascript:void(0);">${name}</a></li>`,
        tabButton: (btnText) => `<a class="btn btn-primary btn-sm newTabBtn" href="#" role="button">${btnText}</a>`,
        imgFilter: `[src*="circle_red"],[src*="circle_green"],[src*="circle_yellow"]`
    };

    const css = {
        highlight: `<style>
            .tableHighlight {
                box-shadow: inset 25px 0px 25px -25px rgb(107, 238, 158), inset -25px 0px 25px -25px rgb(107, 238, 158);
            }
        </style>`,
        tabs: `<style>
            #eventTabs .nav-link.active {
                background-color: #FFFFE0
            }
            #eventTabs .nav-link {
                border-color: #ccc;
                border-bottom: none;
                margin-right: 1px;
            }
            #tabsRow {
                margin-left: 0;
            }
            .newTabBtn {
                margin: 4px 0 5px 25px;
                color: #fff!important;
                height: 25px;
                padding: 3px 8px 3px 8px;
            }
            .nav-tabs {
                border-bottom: none;
            }
        </style>`
    }

    // Disable the active table if its in use
    if (!datatables_disable.event_grid_table) {
        disableFixedTableHdrs('event_grid_table', 0);
        return;
    }

    // Checkbox settings
    if (config["align-th-top"]) {
        $("#event_grid_table th").css("vertical-align", "top");
    }

    if (config["align-th-center"]) {
        $("#event_grid_table th").css("text-align", "center");
    }

    if (config["th-nowrap"]) {
        $("#event_grid_table th .evTitle").css("white-space", "nowrap");
    }

    if (config["remove-collapse"]) {
        $("#event_grid_table button.btn-table-collapse").remove();
    }

    if (config["align-img-center"]) {
        $("#event_grid_table a img").css("margin-right", "");
        $("#event_grid_table .invis").remove();
    }

    // Alert
    if (config["record-alert"]) {
        $("#center table").first().after(html.alert);
    }

    // Repeating Instrument Tables
    config["hide-repeating-table"]?.filter(y => y).forEach((el) =>
        $(`table[id^=repeat_instrument_table][id$=${el}]`).parent().remove()
    );
    config["full-size-repeating-table"]?.filter(y => y).forEach((el) =>
        $(`table[id^=repeat_instrument_table][id$=${el}]`).parent().removeClass().addClass('float-left')
    );

    // Get table refrence
    $("#event_grid_table th").attr("data-orderable", "false");
    let $table = $("#event_grid_table").DataTable({
        paginate: false,
        order: [],
        dom: "t"
    });

    // Setup Hiding for rows
    let hiddenRows = [];
    let hiddenRowsTmp = [];
    $.fn.dataTable.ext.search.push((settings, data, dataIndex) => {
        let name = $($table.row(dataIndex).node()).find("td>span").first().attr("data-mlm-name");
        return !hiddenRows.includes(name) && !hiddenRowsTmp.includes(name);
    });

    // User hidden rows
    hiddenRows = hiddenRows.concat(config["hide-form-row"]?.filter(y => y));

    // User hidden columns
    if (config["hide-event"]) {
        config["hide-event"].forEach((event_id) => {
            let col = $(`div[data-mlm-name=${event_id}]`).parent();
            $table.column(col).visible(false, false);
        });
    }

    // System Management Table
    if (config["system-management-event"]) {
        let $header = $(`div[data-mlm-name=${config["system-management-event"]}]`).parent();
        const maxCells = 5;
        const title = $header.find(".evTitle").text();
        const subtitle = $header.find(".custom_event_label").text();

        $("#record_display_name").after(html.table(title, subtitle));
        $("#event_grid_table button.btn-table-collapse").remove();

        let count = 0;
        let formNames = $table.column(0).data().toArray();
        $table.column($header).data().toArray().forEach((el, index) => {
            if (!el || el.includes("deleteEventInstance")) return;
            if (count++ % maxCells == 0) {
                $(".sysManTable tr").last().after("<tr></tr>");
            }
            $(".sysManTable tr").last().append(html.td(el, formNames[index]));
            let row = $table.row(index);
            // We expect 2 values, the hidden col and the name
            if (row.data().filter(y => y).length <= 2) {
                hiddenRows.push($(row.node()).find("td>span").first().attr("data-mlm-name"));
            }
        });
        $("#sysManTable .invis").remove(); // Remove hidden "+" buttons in the table
        $table.column($header).visible(false);
        $table.draw();
    }

    // Highlighted events
    let highlights = config.highlight.today.concat(config.highlight.range);
    if (highlights.length) {
        $("head").append(css.highlight);
        highlights.forEach((event_id) => {
            let col = $(`div[data-mlm-name=${event_id}]`).first().parent()
            $($table.column(col).nodes()).addClass('tableHighlight');
        });
    }

    // Build out tabs and functionality
    if (config.tabs) {
        $("head").append(css.tabs);
        $("#event_grid_table").before(html.tabRow).css("width", "auto");

        // Tab clicks
        $("body").on('click', '#eventTabs a', (eventObj) => {
            // Flag as active
            $tab = $(eventObj.currentTarget);
            if ($tab.hasClass('active')) return;
            $('#eventTabs a').removeClass('active');
            $tab.addClass('active');

            // Show all columns and then and build show/hide list
            $table.columns().visible(true, false);
            let hide = [...Array($table.columns().data().length - 1)].map((_, i) => i + 1);
            let show = config.tabs[$tab.text()].events.map((event_id) => {
                let col = $(`div[data-mlm-name=${event_id}]`).first().parent();
                return $table.column(col).index();
            });

            // Update and draw
            hiddenRowsTmp = [];
            $table.columns(hide.filter(y => !show.includes(y))).visible(false, false);
            $table.columns.adjust().draw();

            // Hide select rows
            let hiddenCols = $table.columns().indexes("visible");
            $table.rows({ filter: 'applied' }).every(function (rowIdx, tableLoop, rowLoop) {
                let data = this.data().filter((el, index) => index > 0 && hiddenCols[index] && el);
                if (data.length) return;
                hiddenRowsTmp.push($(this.node()).find("td>span").first().attr("data-mlm-name"));
            });

            // Draw again
            $table.draw();
            $("#event_grid_table").css("width", "auto");
        });

        // Build out every tab & tab button
        let hideTab = false;
        let currentTabs = [];
        $.each(config.tabs, (name, data) => {
            $('#eventTabs').append(html.tab(name));
            if (data.button) {
                let shownTabs = $('#eventTabs a:visible').filter((_, el) => currentTabs.includes($(el).text()));
                if (shownTabs.length == currentTabs.length) {
                    $('#tabsRow .newTabBtn').last().remove();
                }
                currentTabs = [];
                hideTab = true;
                if (!('logic' in data) || data.logic) {
                    $('#tabsRow').append(html.tabButton(data.button));
                }
            }
            if (hideTab) {
                currentTabs.push(name);
                $('#eventTabs a').last().click();
                if ($('#event_grid_table img:visible').filter(html.imgFilter).length == 0) {
                    $('#eventTabs li').last().hide();
                }
            }
        });

        // New Tab Button clicks
        $('.newTabBtn').on('click', (el) => {
            let $el = $(el.currentTarget);
            let btnMap = {};
            let currentBtn = ""
            $.each(config.tabs, (tab, data) => {
                currentBtn = data.button || currentBtn;
                if (currentBtn) {
                    btnMap[currentBtn] = btnMap[currentBtn] || [];
                    btnMap[currentBtn].push(tab);
                }
            });
            $('#eventTabs li').not(':visible').filter((_, y) => btnMap[$el.text()].includes($(y).text())).first().show();
            $el.hide();
        });

        $("#eventTabs a").first().click();
    }

    // Make the whole table resizable because why not
    $("#event_grid_table").resizable({ handles: "e" });

    // Prevent the first col from getting too small
    const tmp = $($table.column(0).header());
    tmp.css('min-width', tmp.css('width'));

    // Show the screen, it was hidden in PHP
    $("#center").css("opacity", "100");

    // Redraw to be safe
    $table.draw();
});