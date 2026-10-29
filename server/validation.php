<?php
declare(strict_types=1);

// Domain validation shared by the HTTP service and the CLI tests. No WordPress dependency.
function bh_require(bool $ok, string $message = 'These records are not a valid BarnCareHub backup.'): void {
    if (!$ok) throw new InvalidArgumentException($message);
}
function bh_text($v): bool { return is_string($v) && strlen($v) <= 10000; }
function bh_date($v): bool {
    if (!is_string($v) || !preg_match('/^\d{4}-\d{2}-\d{2}$/D', $v)) return false;
    return checkdate((int)substr($v, 5, 2), (int)substr($v, 8, 2), (int)substr($v, 0, 4));
}
function bh_fields(array $row, array $fields): void {
    foreach ($fields as $field) bh_require(bh_text($row[$field] ?? null));
}
function bh_validate(array $s): array {
    bh_require(($s['schema'] ?? null) === 1 && is_int($s['revision'] ?? null) && $s['revision'] >= 0);
    bh_require(bh_text($s['savedAt'] ?? null) && in_array($s['mode'] ?? null, ['blank','roster','examples'], true));
    bh_require(is_array($s['data'] ?? null));
    $d = $s['data']; $ids = [];
    foreach (['horses','care','tasks','events','history','helpers','shifts','daysOff'] as $key) {
        bh_require(isset($d[$key]) && is_array($d[$key]) && array_is_list($d[$key]) && count($d[$key]) <= 10000);
        $ids[$key] = [];
        foreach ($d[$key] as $r) {
            bh_require(is_array($r) && bh_text($r['id'] ?? null) && strlen($r['id']) > 0 && strlen($r['id']) <= 200);
            bh_require(!isset($ids[$key][$r['id']])); $ids[$key][$r['id']] = true;
        }
    }
    foreach ($d['horses'] as $h) {
        bh_fields($h, ['name','breed','colour','location','specialInstructions']);
        bh_require(trim($h['name']) !== '' && trim($h['location']) !== '' && is_array($h['owner'] ?? null));
        bh_fields($h['owner'], ['id','name']);
        foreach (['birthDate','arrivalDate'] as $key) bh_require(($h[$key] ?? null) === '' || bh_date($h[$key] ?? null));
        bh_require(in_array($h['sex'] ?? null, ['','Mare','Gelding','Stallion'], true));
        bh_require(in_array($h['status'] ?? null, ['Active','Away','Archived'], true));
        bh_require(!isset($h['registeredName']) || bh_text($h['registeredName']));
        bh_require(!array_key_exists('specialCharacteristics',$h) || bh_text($h['specialCharacteristics']));
        foreach (['specialCareStart','specialCareEnd'] as $key) bh_require(!array_key_exists($key,$h) || $h[$key] === '' || bh_date($h[$key]));
        bh_require(empty($h['specialCareStart']) || empty($h['specialCareEnd']) || $h['specialCareEnd'] >= $h['specialCareStart'], 'The special care end date must follow its start date.');
    }
    foreach ($d['care'] as $c) {
        bh_require(isset($ids['horses'][$c['horseId'] ?? '']));
        bh_require(in_array($c['kind'] ?? null, ['feed','supplement','medication'], true));
        bh_require(in_array($c['schedule'] ?? null, ['AM','Lunch','PM','AM & PM','AM & Lunch','Lunch & PM','AM & Lunch & PM'], true));
        bh_fields($c, ['name','instructions', $c['kind'] === 'medication' ? 'dose' : 'quantity']);
        bh_require(bh_date($c['effectiveStart'] ?? null) && (!isset($c['effectiveEnd']) || bh_date($c['effectiveEnd'])));
    }
    foreach (['tasks'=>['category','period','title','detail'], 'events'=>['type','time','provider','reason','notes'], 'history'=>['title','detail','author','type']] as $key=>$fields) {
        foreach ($d[$key] as $r) {
            bh_require((isset($ids['horses'][$r['horseId'] ?? '']) || ($key === 'events' && ($r['type'] ?? '') === 'Chore' && ($r['horseId'] ?? null) === '')) && bh_date($r['date'] ?? null)); bh_fields($r, $fields);
        }
    }
    foreach ($d['events'] as $e) {
        bh_require(in_array($e['type'], ['Vet','Farrier','Dentist','Medication change','Feed change','Vaccination','Deworming','Weight check','Other','Chore'], true));
        if ($e['type'] === 'Chore') bh_require(trim($e['reason']) !== '', 'Enter a chore title.');
        if (array_key_exists('repeat',$e)) bh_require($e['type'] === 'Chore' && in_array($e['repeat'], ['daily','weekly'], true));
        if (($e['repeat'] ?? '') === 'weekly') bh_require(isset($e['repeatDays']) && is_array($e['repeatDays']) && count($e['repeatDays']) > 0);
        if (array_key_exists('repeatDays',$e)) {
            bh_require(($e['repeat'] ?? '') === 'weekly' && is_array($e['repeatDays']) && array_is_list($e['repeatDays']) && count(array_unique($e['repeatDays'], SORT_REGULAR)) === count($e['repeatDays']));
            foreach ($e['repeatDays'] as $day) bh_require(is_int($day) && $day >= 1 && $day <= 7);
        }
        if (array_key_exists('repeatUntil',$e)) bh_require(isset($e['repeat']) && bh_date($e['repeatUntil']) && $e['repeatUntil'] >= $e['date']);
        bh_require($e['time'] === '' || preg_match('/^([01][0-9]|2[0-3]):[0-5][0-9]$/D', $e['time']) === 1);
        bh_require(!isset($e['farrierWork']) || ($e['type'] === 'Farrier' && in_array($e['farrierWork'], ['Trim','Shoeing','Shoe removal','Other'], true)));
        bh_require(!isset($e['farrierFeet']) || bh_text($e['farrierFeet']));
    }
    foreach ($d['history'] as $h) {
        bh_require(!isset($h['provider']) || bh_text($h['provider']));
        bh_require(in_array($h['type'], ['Vet','Farrier','Medication','Feed','Weight','Notes','Photo'], true));
        bh_require(!isset($h['farrierWork']) || ($h['type'] === 'Farrier' && in_array($h['farrierWork'], ['Trim','Shoeing','Reset / refit','Shoe removal','Other'], true)));
        bh_require(!isset($h['farrierFeet']) || bh_text($h['farrierFeet']));
        bh_require(!isset($h['voided']) || is_bool($h['voided']));
    }
    $eventsById = array_column($d['events'], null, 'id'); $recordedVisits = [];
    foreach ([...$d['events'], ...$d['history']] as $row) if (array_key_exists('farrierWeekOnly', $row)) {
        bh_require($row['type'] === 'Farrier' && is_bool($row['farrierWeekOnly']) && (!$row['farrierWeekOnly'] || (new DateTimeImmutable($row['date']))->format('N') === '1'), 'A farrier week must start on Monday.');
    }
    foreach ($d['history'] as $h) if (array_key_exists('sourceEventId', $h)) {
        bh_require(bh_text($h['sourceEventId']));
        $event = $eventsById[$h['sourceEventId']] ?? null;
        bh_require($h['type'] === 'Farrier' && $event && $event['type'] === 'Farrier' && $event['horseId'] === $h['horseId'], 'A farrier record must match its planned horse visit.');
        if (empty($h['voided'])) { bh_require(!isset($recordedVisits[$h['sourceEventId']]), 'This farrier visit already has a completed work record.'); $recordedVisits[$h['sourceEventId']] = true; }
    }
    foreach ($d['helpers'] as $h) { bh_fields($h, ['name','initials']); bh_require(trim($h['name']) !== '' && (!array_key_exists('archived',$h) || is_bool($h['archived']))); }
    foreach (['shifts','daysOff'] as $key) foreach ($d[$key] as $r) {
        bh_require(isset($ids['helpers'][$r['helperId'] ?? '']) && bh_date($r['date'] ?? null));
        if ($key === 'shifts') bh_require(bh_text($r['paddock'] ?? null) && trim($r['paddock']) !== '' && in_array($r['period'] ?? null, ['AM','Lunch','PM'], true));
        else bh_require(!isset($r['note']) || bh_text($r['note']));
    }
    foreach (['events','shifts','daysOff'] as $key) foreach ($d[$key] as $r) bh_require(!isset($r['cancelled']) || is_bool($r['cancelled']));
    // JSON objects are decoded as stdClass so an empty completion map stays {}.
    bh_require(isset($s['completions']) && is_object($s['completions']) && count((array)$s['completions']) <= 50000);
    foreach ($s['completions'] as $key=>$c) {
        bh_require(strlen((string)$key) <= 20000 && is_object($c));
        bh_fields((array)$c, ['completedBy','completedAt']);
    }
    return $s;
}
function bh_decode(string $json): array {
    $s = json_decode($json, true, 64, JSON_THROW_ON_ERROR);
    $object = json_decode($json, false, 64, JSON_THROW_ON_ERROR);
    bh_require(is_array($s) && is_object($object));
    $s['completions'] = $object->completions ?? null;
    return bh_validate($s);
}
// Older open profile forms omit fields added in later releases. Preserve those
// fields; a current form sends an explicit empty string when clearing them.
function bh_preserve_profile_fields(array $old, array $next): array {
    $horses = array_column($old['data']['horses'], null, 'id');
    foreach ($next['data']['horses'] as &$horse) foreach (['specialCharacteristics','specialCareStart','specialCareEnd'] as $field) {
        if (!array_key_exists($field, $horse) && array_key_exists($field, $horses[$horse['id']] ?? [])) $horse[$field] = $horses[$horse['id']][$field];
    }
    unset($horse);
    return $next;
}
function bh_authorize_change(array $old, array $next, bool $admin, bool $replace): void {
    if ($replace) { bh_require($admin, 'Only the barn administrator can replace or reset the shared records.'); return; }
    bh_require($old['mode'] === $next['mode'], 'Use the administrator restore controls to replace records.');
    bh_require($old['data']['tasks'] === $next['data']['tasks'], 'Task records are not edited directly.');
    foreach (['horses','care','events','history','helpers','shifts','daysOff'] as $key) {
        $nextIds = array_column($next['data'][$key], 'id');
        foreach ($old['data'][$key] as $r) bh_require(in_array($r['id'], $nextIds, true), 'Keep existing records; stop care or cancel appointments and assignments instead of deleting them.');
    }
    foreach (['shifts','daysOff'] as $key) {
        if ($old['data'][$key] === $next['data'][$key]) continue;
        $slots = [];
        foreach ($next['data'][$key] as $r) {
            if (!empty($r['cancelled'])) continue;
            $slot = json_encode($key === 'shifts' ? [$r['date'],$r['paddock'],$r['period'],$r['helperId']] : [$r['date'],$r['helperId']]);
            bh_require(!isset($slots[$slot]), 'That assignment or day off is already recorded. Refresh the schedule.');
            $slots[$slot] = true;
        }
    }
    $oldShifts = array_column($old['data']['shifts'], null, 'id');
    $helpers = array_column($next['data']['helpers'], null, 'id');
    foreach ($next['data']['shifts'] as $shift) if (!empty($helpers[$shift['helperId']]['archived']) && empty($shift['cancelled'])) {
        bh_require(($oldShifts[$shift['id']] ?? null) === $shift, 'Restore the archived helper before adding new assignments. Existing records are kept.');
    }
}
