<?php
header('Content-Type: application/json');
echo json_encode([
    'status' => 'OK',
    'message' => 'Le backend fonctionne !',
    'time' => date('Y-m-d H:i:s')
]);
?>