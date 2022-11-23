<?php

namespace UWMadison\RecordHomeTweaks;

use ExternalModules\AbstractExternalModule;
use REDCap;
use LogicTester;

class RecordHomeTweaks extends AbstractExternalModule
{
    public function redcap_every_page_top($project_id)
    {
        // Exit if not Record Home Page or log out
        if (!$this->isPage('DataEntry/record_home.php') || empty($_GET['id']) || !defined("USERID")) {
            return;
        }

        // Setup 
        $config = $this->getProjectSettings();
        $config["highlight"] = ["today" => [], "range" => []];
        $today = date("Y-m-d");
        $record = $_GET['id'];

        // Process the tab names config
        $tabnames  = array_filter($config["tab-name"]);
        foreach ($tabnames as $index => $name) {
            $config["tabs"][$name] = [
                "events" => $config["tab-event"][$index],
                "button" => $config["tab-button"][$index]
            ];
            $logic = $config["tab-logic"][$index];
            if (!empty($logic)) {
                $config["tabs"][$name]["logic"] = LogicTester::evaluateLogicSingleRecord($logic, $record);
            }
        }

        // Process the scheduled dates config
        $field = $config["scheduled-date"];
        $events = $config["scheduled-date-event"];
        if (!empty($field) && !empty($events)) {
            $data = REDCap::getData($project_id, 'array', $record, $field, $events)[$record];
            unset($data["repeat_instances"]);
            foreach ($data as $eventName => $eventData) {
                if ($eventData[$field] == $today)
                    $config["highlight"]["today"][] = htmlspecialchars($eventName, ENT_QUOTES);
            }
        }

        // Process the scheduled ranges config
        $fieldStart = $config["scheduled-range-start"];
        $fieldEnd = $config["scheduled-range-end"];
        $events = $config["scheduled-range-event"];
        if (!empty($fieldStart) && !empty($fieldEnd) && !empty($events)) {
            $data = REDCap::getData($project_id, 'array', $record, [$fieldStart, $fieldEnd], $events)[$record];
            unset($data["repeat_instances"]);
            foreach ($data as $eventName => $eventData) {
                if ($eventData[$fieldStart] <= $today && $eventData[$fieldEnd] >= $today)
                    $config["highlight"]["range"][] = htmlspecialchars($eventName, ENT_QUOTES);
            }
        }

        // Insert config and js
        $config = json_encode($config);
        $this->initializeJavascriptModuleObject();
        echo "<style>#center { opacity: 0; } </style>";
        echo "<script>{$this->getJavascriptModuleObjectName()}.config = {$config};</script>";
        echo "<script src=\"{$this->getUrl('main.js')}\"></script>";
    }

    public function redcap_data_entry_form($project_id, $record, $instrument)
    {
        // Block navigation to select instruments
        $instruments = $this->getProjectSetting('stop-nav-instrument');
        if (in_array($instrument, $instruments)) {
            $url = APP_PATH_WEBROOT_FULL . "redcap_v" . REDCAP_VERSION . "/DataEntry/record_home.php";
            $params = http_build_query([
                "pid" => $project_id,
                "arm" => $_GET['arm'] ?? '1',
                "id" => $record
            ]);
            header("Location: {$url}?{$params}");
        }
    }
}
