<?php

function createResource($database, $resourceId, $data) {
  $payload = json_decode($data, true);

  if(!isset($payload["fromId"]) || !isset($payload["toId"]) || !isset($payload["content"]) || !isset($payload["timestamp"])) {
    return null;
  }

  $fromId = $payload["fromId"];
  $toId = $payload["toId"];
  $content = $payload["content"];
  $timestamp = $payload["timestamp"];

  $sql = "INSERT INTO `messages` (`fromId`, `toId`, `content`, `timestamp`) VALUES (".$fromId.", ".$toId.", '".$content."', ".$timestamp.")";
  $sql_last_creation = "SELECT * FROM `messages` ORDER BY id DESC LIMIT 1";

  $database->query($sql);
  $database->query($sql_last_creation); // ?? would be better perform a BEGIN;, COMMIT;
  $result = $database->getRow();
  return json_encode($result);
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
