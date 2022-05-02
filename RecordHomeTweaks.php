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
            
            // Process the tab names config
            $tabnames  = array_filter($config["tab-name"]);
            foreach( $tabnames as $index => $name ) {
                $config["tabs"][$name] = [
                    "events" => $config["tab-event"][$index],
                    "button" => $config["tab-button"][$index]
                ];
            }
            
            // Setup for the below
            $config["highlight"] = ["today"=>[],"range"=>[]];
            $today = date("Y-m-d");
            $record = $_GET['id'];
            
            // Process the scheduled dates config
            $field = $config["scheduled-date"];
            $events = $config["scheduled-date-event"];
            if ( !empty($field) && !empty($events) ) {
                $data = REDCap::getData( $project_id, 'array', $record, $field, $events )[$record];
                unset($data["repeat_instances"]);
                foreach( $data as $eventName => $eventData ) {
                    if ( $eventData[$field] == $today ) 
                        $config["highlight"]["today"][] = $eventName;
                }
            }
            
            // Process the scheduled ranges config
            $fieldStart = $config["scheduled-range-start"];
            $fieldEnd = $config["scheduled-range-end"];
            $events = $config["scheduled-range-event"];
            if ( !empty($fieldStart) && !empty($fieldEnd) && !empty($events) ) {
                $data = REDCap::getData( $project_id, 'array', $record, [$fieldStart, $fieldEnd], $events )[$record];
                unset($data["repeat_instances"]);
                foreach( $data as $eventName => $eventData ) {
                    if ( $eventData[$fieldStart] <= $today && $eventData[$fieldEnd] >= $today ) 
                        $config["highlight"]["range"][] = $eventName;
                }
            }
            
            // Throw out junk and pass down to JS
            unset($config["tab-event"], $config["tab-button"], $config["tab-name"],
                  $config["enabled"], $config["event-tabs"],
                  $config["scheduled-description"],$config["scheduled-date"],
                  $config["scheduled-date-event"],$config["scheduled-range-event"],
                  $config["scheduled-range-start"],$config["scheduled-range-end"]);
            echo "<style>#center { opacity: 0; } </style>";
            echo "<script>".$this->module_global." = ".json_encode($config).";</script>";
            echo '<script src="' . $this->getUrl('main.js') . '"></script>';
        }
    }
    
    public function redcap_data_entry_form($project_id, $record, $instrument) {
        
        // Block navigation to select instruments
        $instruments = $this->getProjectSetting('stop-nav-instrument');
        if ( in_array($instrument, $instruments) ) {
            $arm = $_GET['arm'] ?? '1';
            header("Location: https://".$_SERVER['HTTP_HOST']."/redcap/redcap_v".REDCAP_VERSION."/DataEntry/record_home.php?pid=".$project_id."&arm=".$arm."&id=".$record);
        }
    }
}

?>
