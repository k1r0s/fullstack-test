<?php

function createResource($arr_assoc, $resourceId, $data) {

}

function readResource($database, $resourceId, $query) {
  $sql = "SELECT * FROM `session` WHERE email = 'ciro.asd@zz.net'";
  $database->query($sql);
  $result = $database->getRow();
  return json_encode($result);
}

function updateResource($arr_assoc, $resourceId, $data) {

}

function deleteResource($arr_assoc, $resourceId) {

}
