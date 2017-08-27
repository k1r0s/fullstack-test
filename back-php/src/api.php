<?php

header("Access-Control-Allow-Origin: *");
$resourceList = array("session", "messages", "profiles");

$path = explode("/", $_SERVER["REQUEST_URI"]);
$resourceName = $path[1];
$resourceId = $path[2];

if(!in_array($resourceName, $resourceList)) {
  http_response_code(404);
  exit();
}

$method = $_SERVER["REQUEST_METHOD"];
$query = $_SERVER["QUERY_STRING"];
$data = file_get_contents("php://input");

$fileContents = file_get_contents($_SERVER["DOCUMENT_ROOT"]."/db.json");
$jsonStorage = json_decode($fileContents, true);

http_response_code(200);
exit();
