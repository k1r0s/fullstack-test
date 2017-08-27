<?php

function createResource($database, $resourceId, $data) {

}

function readResource($database, $resourceId, $query) {
  if(!isset($query["fromId"]) || !isset($query["toId"])) {
    return null;
  }

  $fromId = $query["fromId"];
  $toId = $query["toId"];

  $sql = "SELECT * FROM `messages` WHERE fromId = ".$fromId." AND toId = ".$toId;
  $database->query($sql);
  $result = $database->getRows();
  return json_encode($result);
}

function updateResource($database, $resourceId, $data) {

}

function deleteResource($database, $resourceId, $data) {

}
