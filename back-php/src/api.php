<?php

header('Access-Control-Allow-Origin: *');
$resourceList = array("session", "messages", "profiles");

$method = $_SERVER["REQUEST_METHOD"];
$path = explode("/", $_SERVER["REQUEST_URI"]);
$query = $_SERVER["QUERY_STRING"];
$data = file_get_contents('php://input');
$resourceName = $path[1];
$resourceId = $path[2];

if(!in_array($resourceName, $resourceList)) {
  http_response_code(404);
  exit();
}

http_response_code(200);
exit();
