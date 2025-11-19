<?php
// SIMPLE API - NO .htaccess NEEDED
// Just put this file in: C:\xampp\htdocs\api.php
// Access: http://localhost/api.php/clubs

header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Database connection
$host = 'localhost';
$dbname = 'student_club_db';
$username = 'root';
$password = '';

try {
    $db = new PDO("mysql:host=$host;dbname=$dbname", $username, $password);
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch(PDOException $e) {
    die(json_encode(['error' => 'Database connection failed: ' . $e->getMessage()]));
}

// Get the request path
$path = $_SERVER['PATH_INFO'] ?? '';
$path = trim($path, '/');
$parts = explode('/', $path);
$resource = $parts[0] ?? '';
$id = $parts[1] ?? null;
$method = $_SERVER['REQUEST_METHOD'];

// Route the request
if ($resource === 'clubs') {
    handleClubs($db, $method, $id);
} elseif ($resource === 'members') {
    handleMembers($db, $method, $id);
} elseif ($resource === 'statistics') {
    handleStatistics($db);
} else {
    response(['error' => 'Invalid endpoint. Try: /api.php/clubs or /api.php/members'], 404);
}

function handleClubs($db, $method, $id) {
    switch($method) {
        case 'GET':
            if ($id) {
                $stmt = $db->prepare("SELECT * FROM clubs WHERE club_id = ?");
                $stmt->execute([$id]);
                $club = $stmt->fetch(PDO::FETCH_ASSOC);
                if ($club) {
                    response(['success' => true, 'data' => $club]);
                } else {
                    response(['error' => 'Club not found'], 404);
                }
            } else {
                $stmt = $db->query("SELECT * FROM clubs ORDER BY created_at DESC");
                response(['success' => true, 'data' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
            }
            break;
        
        case 'POST':
            $data = json_decode(file_get_contents('php://input'), true);
            if (empty($data['club_name']) || empty($data['club_category'])) {
                response(['error' => 'Club name and category required'], 400);
            }
            $stmt = $db->prepare("INSERT INTO clubs (club_name, club_category, description, advisor_name) VALUES (?, ?, ?, ?)");
            $stmt->execute([$data['club_name'], $data['club_category'], $data['description'] ?? '', $data['advisor_name'] ?? '']);
            response(['success' => true, 'message' => 'Club created', 'club_id' => $db->lastInsertId()], 201);
            break;
        
        case 'PUT':
            if (!$id) response(['error' => 'Club ID required'], 400);
            $data = json_decode(file_get_contents('php://input'), true);
            $stmt = $db->prepare("UPDATE clubs SET club_name=?, club_category=?, description=?, advisor_name=? WHERE club_id=?");
            $stmt->execute([$data['club_name'], $data['club_category'], $data['description'], $data['advisor_name'], $id]);
            response(['success' => true, 'message' => 'Club updated']);
            break;
        
        case 'DELETE':
            if (!$id) response(['error' => 'Club ID required'], 400);
            $stmt = $db->prepare("DELETE FROM clubs WHERE club_id = ?");
            $stmt->execute([$id]);
            response(['success' => true, 'message' => 'Club deleted']);
            break;
        
        default:
            response(['error' => 'Method not allowed'], 405);
    }
}

function handleMembers($db, $method, $id) {
    switch($method) {
        case 'GET':
            if ($id) {
                $stmt = $db->prepare("SELECT m.*, c.club_name FROM members m LEFT JOIN clubs c ON m.club_id=c.club_id WHERE m.member_id=?");
                $stmt->execute([$id]);
                $member = $stmt->fetch(PDO::FETCH_ASSOC);
                if ($member) {
                    response(['success' => true, 'data' => $member]);
                } else {
                    response(['error' => 'Member not found'], 404);
                }
            } else {
                $stmt = $db->query("SELECT m.*, c.club_name FROM members m LEFT JOIN clubs c ON m.club_id=c.club_id ORDER BY m.registration_date DESC");
                response(['success' => true, 'data' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
            }
            break;
        
        case 'POST':
            $data = json_decode(file_get_contents('php://input'), true);
            if (empty($data['student_id']) || empty($data['full_name']) || empty($data['email']) || empty($data['club_id'])) {
                response(['error' => 'Student ID, name, email, and club required'], 400);
            }
            $stmt = $db->prepare("INSERT INTO members (student_id, full_name, email, phone, club_id, membership_type) VALUES (?, ?, ?, ?, ?, ?)");
            $stmt->execute([$data['student_id'], $data['full_name'], $data['email'], $data['phone'] ?? '', $data['club_id'], $data['membership_type'] ?? 'Regular']);
            response(['success' => true, 'message' => 'Member registered', 'member_id' => $db->lastInsertId()], 201);
            break;
        
        case 'PUT':
            if (!$id) response(['error' => 'Member ID required'], 400);
            $data = json_decode(file_get_contents('php://input'), true);
            $stmt = $db->prepare("UPDATE members SET student_id=?, full_name=?, email=?, phone=?, club_id=?, membership_type=? WHERE member_id=?");
            $stmt->execute([$data['student_id'], $data['full_name'], $data['email'], $data['phone'], $data['club_id'], $data['membership_type'], $id]);
            response(['success' => true, 'message' => 'Member updated']);
            break;
        
        case 'DELETE':
            if (!$id) response(['error' => 'Member ID required'], 400);
            $stmt = $db->prepare("DELETE FROM members WHERE member_id = ?");
            $stmt->execute([$id]);
            response(['success' => true, 'message' => 'Member deleted']);
            break;
        
        default:
            response(['error' => 'Method not allowed'], 405);
    }
}

function handleStatistics($db) {
    $stats = [
        'totalClubs' => $db->query("SELECT COUNT(*) FROM clubs")->fetchColumn(),
        'totalMembers' => $db->query("SELECT COUNT(*) FROM members")->fetchColumn(),
        'membersByClub' => $db->query("SELECT c.club_name, COUNT(m.member_id) as member_count FROM clubs c LEFT JOIN members m ON c.club_id=m.club_id GROUP BY c.club_id, c.club_name")->fetchAll(PDO::FETCH_ASSOC)
    ];
    response(['success' => true, 'data' => $stats]);
}

function response($data, $code = 200) {
    http_response_code($code);
    echo json_encode($data);
    exit;
}
?>
