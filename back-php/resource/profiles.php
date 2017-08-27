<?php

function createResource($database, $resourceId, $data) {
  
}

function readResource($database, $resourceId, $data) {
  $sql = "SELECT * FROM `profiles`";
  $database->query($sql);
  $result = $database->getRows();
  return json_encode($result);
}

function updateResource($database, $resourceId, $data) {

}

function deleteResource($database, $resourceId, $data) {

}
