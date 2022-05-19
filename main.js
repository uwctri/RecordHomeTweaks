RecordHomeTweaks.html = {};
RecordHomeTweaks.css = {};
RecordHomeTweaks.fn = {};
RecordHomeTweaks.html.alert = `
<div class="alert alert-primary" role="alert" style="border-color:#b8daff!important;width:800px"> 
    ${RecordHomeTweaks["record-alert"]}
</div>`;
RecordHomeTweaks.html.table = (title, subtitle) => `
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
</div>`;
RecordHomeTweaks.html.td = (btn, name) => `
<td class="nowrap" style="text-align:center;">${btn}
    <span style="margin-left:5px">${name}</span>
</td>`;
RecordHomeTweaks.html.tabRow = `<div id="tabsRow" class="row"><ul class="nav nav-tabs" id="eventTabs"></ul></div>`;
RecordHomeTweaks.html.tab = (name) => `<li class="nav-item"><a class="nav-link" href="javascript:void(0);">${name}</a></li>`;
RecordHomeTweaks.html.tabButton = (btnText) => `<a class="btn btn-primary btn-sm newTabBtn" href="#" role="button">${btnText}</a>`;
RecordHomeTweaks.html.imgFilter = `[src*="circle_red"],[src*="circle_green"],[src*="circle_yellow"]`;
RecordHomeTweaks.css.highlight =
    `<style>
    .tableHighlight {
        box-shadow: inset 25px 0px 25px -25px rgb(107, 238, 158), inset -25px 0px 25px -25px rgb(107, 238, 158);
    }
</style>`;
RecordHomeTweaks.css.tabs =
    `<style>
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
</style>`;

RecordHomeTweaks.fn.watchdog = () => {
    if ($("a:contains(Table not displaying properly)").length != 0) {
        disableFixedTableHdrs('event_grid_table', 0);
        return;
    }
    setTimeout(RecordHomeTweaks.fn.watchdog, 1000);
    $("#FixedTableHdrsEnable").hide();
}

$(document).ready(() => {

    if (!datatables_disable.event_grid_table) {
        disableFixedTableHdrs('event_grid_table', 0);
        return;
    }

    // Checkbox settings
    if (RecordHomeTweaks["align-th-top"]) {
        $("#event_grid_table th").css("vertical-align", "top");
    }

    if (RecordHomeTweaks["remove-collapse"]) {
        $("#event_grid_table button.btn-table-collapse").remove();
    }

    if (RecordHomeTweaks["align-img-center"]) {
        $("#event_grid_table a img").css("margin-right", "");
        $("#event_grid_table .invis").remove();
    }

    // Alert
    if (RecordHomeTweaks["record-alert"]) {
        $("#center table").first().after(RecordHomeTweaks.html.alert);
    }

    // Repeating Instrument Tables
    RecordHomeTweaks["hide-repeating-table"]?.filter(y => y).forEach((el) =>
        $(`table[id^=repeat_instrument_table][id$=${el}]`).parent().remove()
    );
    RecordHomeTweaks["full-size-repeating-table"]?.filter(y => y).forEach((el) =>
        $(`table[id^=repeat_instrument_table][id$=${el}]`).parent().removeClass().addClass('float-left')
    );

    // Get table refrence
    $("#event_grid_table th").attr("data-orderable", "false");
    RecordHomeTweaks.table = $("#event_grid_table").DataTable({
        paginate: false,
        order: [],
        dom: "t"
    });

    // Setup Hiding for rows
    RecordHomeTweaks.hiddenRows = [];
    RecordHomeTweaks.hiddenRowsTmp = [];
    $.fn.dataTable.ext.search.push((settings, data, dataIndex) => {
        let name = $(RecordHomeTweaks.table.row(dataIndex).node()).find("td>span").first().attr("data-mlm-name");
        return !RecordHomeTweaks.hiddenRows.includes(name) && !RecordHomeTweaks.hiddenRowsTmp.includes(name);
    });

    // User hidden rows
    RecordHomeTweaks.hiddenRows = RecordHomeTweaks.hiddenRows.concat(RecordHomeTweaks["hide-form-row"]?.filter(y => y));

    // User hidden columns
    if (RecordHomeTweaks["hide-event"]) {
        RecordHomeTweaks["hide-event"].forEach((event_id) => {
            let col = $(`div[data-mlm-name=${event_id}]`).parent();
            RecordHomeTweaks.table.column(col).visible(false, false);
        });
    }

    // System Management Table
    if (RecordHomeTweaks["system-management-event"]) {
        let $header = $(`div[data-mlm-name=${RecordHomeTweaks["system-management-event"]}]`).parent();
        const maxCells = 5;
        const title = $header.find(".evTitle").text();
        const subtitle = $header.find(".custom_event_label").text();

        $("#record_display_name").after(RecordHomeTweaks.html.table(title, subtitle));
        $("#event_grid_table button.btn-table-collapse").remove();

        let count = 0;
        let formNames = RecordHomeTweaks.table.column(0).data().toArray();
        RecordHomeTweaks.table.column($header).data().toArray().forEach((html, index) => {
            if (!html || html.includes("deleteEventInstance")) return;
            if (count++ % maxCells == 0) {
                $(".sysManTable tr").last().after("<tr></tr>");
            }
            $(".sysManTable tr").last().append(RecordHomeTweaks.html.td(html, formNames[index]));
            let row = RecordHomeTweaks.table.row(index);
            // We expect 2 values, the hidden col and the name
            if (row.data().filter(y => y).length <= 2) {
                RecordHomeTweaks.hiddenRows.push($(row.node()).find("td>span").first().attr("data-mlm-name"));
            }
        });
        $("#sysManTable .invis").remove(); // Remove hidden "+" buttons in the table
        RecordHomeTweaks.table.column($header).visible(false);
        RecordHomeTweaks.table.draw();
    }

    // Highlighted events
    let highlights = RecordHomeTweaks.highlight.today.concat(RecordHomeTweaks.highlight.range);
    if (highlights.length) {
        $("head").append(RecordHomeTweaks.css.highlight);
        highlights.forEach((event_id) => {
            let col = $(`div[data-mlm-name=${event_id}]`).first().parent()
            $(RecordHomeTweaks.table.column(col).nodes()).addClass('tableHighlight');
        });
    }

    // Build out tabs and functionality
    if (RecordHomeTweaks.tabs) {
        $("head").append(RecordHomeTweaks.css.tabs);
        $("#event_grid_table").before(RecordHomeTweaks.html.tabRow).css("width", "auto");

        // Tab clicks
        $("body").on('click', '#eventTabs a', (eventObj) => {
            // Flag as active
            $tab = $(eventObj.currentTarget);
            if ($tab.hasClass('active')) return;
            $('#eventTabs a').removeClass('active');
            $tab.addClass('active');

            // Show all columns and then and build show/hide list
            RecordHomeTweaks.table.columns().visible(true, false);
            let hide = [...Array(RecordHomeTweaks.table.columns().data().length - 1)].map((_, i) => i + 1);
            let show = RecordHomeTweaks.tabs[$tab.text()].events.map((event_id) => {
                let col = $(`div[data-mlm-name=${event_id}]`).first().parent();
                return RecordHomeTweaks.table.column(col).index();
            });

            // Update and draw
            RecordHomeTweaks.hiddenRowsTmp = [];
            RecordHomeTweaks.table.columns(hide.filter(y => !show.includes(y))).visible(false, false);
            RecordHomeTweaks.table.columns.adjust().draw();

            // Hide select rows
            let hiddenCols = RecordHomeTweaks.table.columns().indexes("visible");
            RecordHomeTweaks.table.rows({ filter: 'applied' }).every(function (rowIdx, tableLoop, rowLoop) {
                let data = this.data().filter((el, index) => index > 0 && hiddenCols[index] && el);
                if (data.length) return;
                RecordHomeTweaks.hiddenRowsTmp.push($(this.node()).find("td>span").first().attr("data-mlm-name"));
            });

            // Draw again
            RecordHomeTweaks.table.draw();
            $("#event_grid_table").css("width", "auto");
        });

        // Build out every tab & tab button
        let hideTab = false;
        let currentTabs = [];
        $.each(RecordHomeTweaks.tabs, (name, data) => {
            $('#eventTabs').append(RecordHomeTweaks.html.tab(name));
            if (data.button) {
                let shownTabs = $('#eventTabs a:visible').filter((_, el) => currentTabs.includes($(el).text()));
                if (shownTabs.length == currentTabs.length) {
                    $('#tabsRow .newTabBtn').last().remove();
                }
                currentTabs = [];
                hideTab = true;
                $('#tabsRow').append(RecordHomeTweaks.html.tabButton(data.button));
            }
            if (hideTab) {
                currentTabs.push(name);
                $('#eventTabs a').last().click();
                if ($('#event_grid_table img:visible').filter(RecordHomeTweaks.html.imgFilter).length == 0) {
                    $('#eventTabs li').last().hide();
                }
            }
        });

        // New Tab Button clicks
        $('.newTabBtn').on('click', (el) => {
            let $el = $(el.currentTarget);
            let btnMap = {};
            let currentBtn = ""
            $.each(RecordHomeTweaks.tabs, (tab, data) => {
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

    // Show the screen, it was hidden in PHP
    $("#center").css("opacity", "100");

    // Redraw to be safe
    RecordHomeTweaks.table.draw();
});