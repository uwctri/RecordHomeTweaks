<?php

namespace UWMadison\RecordHomeTweaks;
use ExternalModules\AbstractExternalModule;
use ExternalModules\ExternalModules;
use REDCap;

class RecordHomeTweaks extends AbstractExternalModule {
    
    private $module_global = 'RecordHomeTweaks';
    
    public function redcap_every_page_top($project_id) {
        
        // Record Home Page
        if ($this->isPage('DataEntry/record_home.php') && $_GET['id']) {
            $config = $this->getProjectSettings();
            $tabnames  = array_filter($config["tab-name"]);
            foreach( $tabnames as $index => $name ) {
                $config["tabs"][$name] = [
                    "events" => $config["tab-event"][$index],
                    "button" => $config["tab-button"][$index]
                ];
            }
            unset($config["hide-events-list"],
                  $config["hide-form-row-list"],
                  $config["hide-repeating-table-list"],
                  $config["full-size-repeating-table-list"],
                  $config["prevent-navigation-instrument-list"],
                  $config["tab-event"], $config["tab-button"], $config["tab-name"],
                  $config["enabled"], $config["event-tabs"]);
            echo "<script>".$this->module_global." = ".json_encode($config).";</script>";
            echo '<script src="' . $this->getUrl('main.js') . '"></script>';
        }
    }
    
    public function redcap_data_entry_form($project_id, $record, $instrument) {
        
        // Block navigation to select instruments
        $instruments = $this->getProjectSetting('stop-nav-instrument')[0];
        if ( in_array($instrument, $instruments) ) {
            $arm = $_GET['arm'] ?? '1';
            header("Location: https://".$_SERVER['HTTP_HOST']."/redcap/redcap_v".REDCAP_VERSION."/DataEntry/record_home.php?pid=".$project_id."&arm=".$arm."&id=".$record);
        }
    }
}

?>
