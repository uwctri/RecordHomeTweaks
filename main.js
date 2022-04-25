RecordHomeTweaks.html = {};
RecordHomeTweaks.fn = {};
RecordHomeTweaks.html.alert = `
<div class="alert alert-primary" role="alert" style="border-color:#b8daff!important;width:800px"> 
    ${RecordHomeTweaks["record-alert"]}
</div>`;
RecordHomeTweaks.html.table = (title,subtitle) => `
<div class="table-responsive">
    <table id="systemManagementTable" class="table table-bordered" style="background-color:#fcfef5;color:#000;width:max-content">
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
RecordHomeTweaks.html.td = (btn,name) => `
<td class="nowrap" style="text-align:center;">${btn}
    <span style="margin-left:5px">${name}</span>
</td>`;
RecordHomeTweaks.html.tabRow = `<div id="tabsRow" class="row"><ul class="nav nav-tabs" id="customRecordHomeTabs"></ul></div>`;
RecordHomeTweaks.html.tab = (name) => `<li class="nav-item"><a class="nav-link" href="javascript:void(0);">${name}</a></li>`;
RecordHomeTweaks.css = 
`<style>
    #customRecordHomeTabs .nav-link.active {
        background-color: #FFFFE0
    }
    #customRecordHomeTabs .nav-link {
        border-color: #ccc;
        border-bottom: none;
        margin-right: 1px;
    }
    #tabsRow {
        margin-left: 0;
    }
    #addNewTabButton {
        margin: 4px 0 5px 25px;
        color: #fff;
        height: 25px;
        padding: 3px 8px 3px 8px;
    }
    .nav-tabs {
        border-bottom: none;
    }
</style>`;

RecordHomeTweaks.fn.watchdog = () => {
    if ( $("a:contains(Table not displaying properly)").length != 0 ) {
        disableFixedTableHdrs('event_grid_table',0);
        return;
    }
    setTimeout(RecordHomeTweaks.fn.watchdog, 1000);
    $("#FixedTableHdrsEnable").hide();
}

$(document).ready(() => {
    
    // Checkbox settings
    if ( RecordHomeTweaks["align-th-top"] ) {
        $("#event_grid_table th").css("vertical-align","top");
    }
    
    if ( RecordHomeTweaks["remove-collapse"] ) {
        $("#event_grid_table button.btn-table-collapse").remove();
    }
    
    if ( RecordHomeTweaks["align-img-center"] ) {
        $("#event_grid_table a img").css("margin-right","");
    }
    
    // Alert
    if ( RecordHomeTweaks["record-alert"] ) {
        $("#center table").first().after(RecordHomeTweaks.html.alert);
    }
    
    // Lower Tables
    RecordHomeTweaks["hide-repeating-table"][0].filter(y=>y).forEach( (el) =>
        $(`table[id^=repeat_instrument_table][id$=${el}]`).parent().remove()
    );
    RecordHomeTweaks["full-size-repeating-table"][0].filter(y=>y).forEach( (el) =>
        $(`table[id^=repeat_instrument_table][id$=${el}]`).parent().removeClass().addClass('float-left')
    );
    
    // Get table refrence
    $("#event_grid_table th").attr("data-orderable","false");
    RecordHomeTweaks.table = $("#event_grid_table").DataTable({
        "paginate": false,
        "order": [],
        "dom": "t"
    });
    
    // Setup Hiding for rows
    RecordHomeTweaks.hiddenRows = [];
    RecordHomeTweaks.hiddenRowsTmp = [];
    $.fn.dataTable.ext.search.push( (settings, data, dataIndex) => {
        let name = $(RecordHomeTweaks.table.row(dataIndex).node()).find("td>span").first().attr("data-mlm-name");
        return !RecordHomeTweaks.hiddenRows.includes(name) && !RecordHomeTweaks.hiddenRowsTmp.includes(name);
    });
    
    // User hidden rows
    RecordHomeTweaks.hiddenRows = RecordHomeTweaks.hiddenRows.concat(RecordHomeTweaks["hide-form-row"][0].filter(y=>y));
    
    // User hidden columns
    if ( RecordHomeTweaks["hide-events"] ) {
        RecordHomeTweaks["hide-events"][0].forEach( (event_id) => {
            let col = $(`div[data-mlm-name=${event_id}]`).parent();
            RecordHomeTweaks.table.column(col).visible(false);
        });
    }
    
    // System Management Table
    if ( RecordHomeTweaks["system-management-event"] ) {
        let maxCells = 5;
        let $header = $(`div[data-mlm-name=${RecordHomeTweaks["system-management-event"]}]`).parent();
        let title = $header.find(".evTitle").text();
        let subtitle = $header.find(".custom_event_label").text();
        
        $("#record_display_name").after(RecordHomeTweaks.html.table(title,subtitle));
        $("#event_grid_table button.btn-table-collapse").remove();
        
        let count = 0;
        let formNames = RecordHomeTweaks.table.column(0).data().toArray();
        RecordHomeTweaks.table.column($header).data().toArray().forEach( (html,index) => {
            if ( !html || html.includes("deleteEventInstance") ) return;
            if (count++ % maxCells == 0) {
                $("#systemManagementTable tr").last().after("<tr></tr>");
            }
            $("#systemManagementTable tr").last().append(RecordHomeTweaks.html.td(html,formNames[index]));
            let row = RecordHomeTweaks.table.row(index);
            // We expect 2 values, the hidden col and the name
            if ( row.data().filter(y=>y).length <= 2 ) {
                RecordHomeTweaks.hiddenRows.push($(row.node()).find("td>span").first().attr("data-mlm-name"));
            }
        });
        RecordHomeTweaks.table.column($header).visible(false);
        RecordHomeTweaks.table.draw();
    }
    
    // Build out tabs and functionality
    if ( RecordHomeTweaks.tabs ) {
        RecordHomeTweaks.fn.watchdog();
        $("head").append(RecordHomeTweaks.css);
        $("#event_grid_table").before(RecordHomeTweaks.html.tabRow).css("width","auto");

        // Build out every tab button
        $.each( Object.keys(RecordHomeTweaks.tabs), (_,name) => { 
            $('#customRecordHomeTabs').append( RecordHomeTweaks.html.tab(name) );
        });
        
        $('#customRecordHomeTabs a').on('click', (eventObj) => {
            // Flag as active
            $tab = $(eventObj.currentTarget);
            $('#customRecordHomeTabs a').removeClass('active');
            $tab.addClass('active');
            
            // Show all columns and then and build show/hide list
            RecordHomeTweaks.table.columns().visible(true,false);
            let hide = [...Array(RecordHomeTweaks.table.columns().data().length-1)].map((_,i)=>i+1);
            let show = RecordHomeTweaks.tabs[$tab.text()].events.map( (event_id) => {
                let col = $(`div[data-mlm-name=${event_id}]`).first().parent();
                return RecordHomeTweaks.table.column(col).index();
            });
            
            // Update and draw
            RecordHomeTweaks.table.columns(hide.filter(y=>!show.includes(y))).visible(false,false);
            RecordHomeTweaks.table.columns.adjust().draw();
            
            // Hide select rows
            //RecordHomeTweaks.hiddenRowsTmp = [];
            //let hiddenCols = RecordHomeTweaks.table.columns().indexes("visible");
            //RecordHomeTweaks.table.rows({filter: 'applied'}).every( function(rowIdx, tableLoop, rowLoop) {
            //    let data = this.data().filter((el,index)=> index>0 && hiddenCols[index] && el);
            //    if ( !data ) return;
            //    RecordHomeTweaks.hiddenRowsTmp.push($(this.node()).find("td>span").first().attr("data-mlm-name"));
            //});
            //
            //// Draw again
            //RecordHomeTweaks.table.draw();

        }).first().click();
        
        // TODO add buttons for the EM
        //if ( typeof CTRItweaks.AddTabText != 'undefined' && CTRItweaks.AddTabText != "") {
        //    $('.nav-link').slice(1).each( function(index) {
        //        $(this).click();
        //        if ( $('#event_grid_table img:visible').filter('[src*="circle_red"],[src*="circle_green"],[src*="circle_yellow"]').length == 0 )
        //            $(this).hide();
        //    });
        //    if ( Object.keys(CTRItweaks.TabConfig).length != $('#customRecordHomeTabs a:visible').length ) {
        //        $('#tabsRow').append('<a id="addNewTabButton" class="btn btn-primary btn-sm" href="#" role="button">'+CTRItweaks.AddTabText+'</a>')
        //        $('#addNewTabButton').on('click', function () {
        //            $('.nav-link').not(':visible').first().show();
        //            $(this).hide();
        //        });
        //    }
        //}
        
    }
});
