const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const { connectToDB, ObjectId } = require('./database');

const root = path.resolve(__dirname, '../..');
const composeArgs = [
    'compose', '-p', 'andes-pacs',
    '-f', 'docker/docker-compose-pacs.yml',
    '--env-file', 'docker/pacs/stack.env',
];

function sleep(ms) {
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

function docker(args) {
    const result = spawnSync('docker', args, { encoding: 'utf8', cwd: root });
    const output = `${result.stdout || ''}\n${result.stderr || ''}`;
    if (result.error) {
        throw result.error;
    }
    if (result.status !== 0) {
        throw new Error(output.trim() || `docker terminó con código ${result.status}`);
    }
    return output;
}

function tools(args) {
    return docker([...composeArgs, 'exec', '-T', 'tools', ...args]);
}

function tag(output, group) {
    const match = output.match(new RegExp('\\(' + group + '\\)[^\\[]*\\[([^\\]]+)\\]'));
    return match ? match[1].trim() : '';
}

function pixelData() {
    const bytes = Buffer.alloc(16 * 16);
    for (let i = 0; i < bytes.length; i++) {
        bytes[i] = (i % 16) * 15;
    }
    return bytes.toString('base64');
}

async function worklist(mongoUri, { prestacionId }) {
    const client = await connectToDB(mongoUri);
    const prestaciones = client.db().collection('prestaciones');
    let prestacion;
    for (let i = 0; i < 30; i++) {
        prestacion = await prestaciones.findOne({ _id: new ObjectId(prestacionId) });
        const metadata = prestacion && prestacion.metadata;
        if (metadata && metadata.find(item => item.key === 'pacs-uid')) {
            break;
        }
        sleep(1000);
        prestacion = null;
    }
    if (!prestacion) {
        throw new Error('la prestación no tiene metadata de PACS');
    }

    const valor = (key) => {
        const item = prestacion.metadata.find(entry => entry.key === key);
        return item && item.valor;
    };
    const studyInstanceUID = valor('pacs-uid');
    const accessionNumber = valor('pacs-accessionNumber');
    const patientId = valor('pacs-pacienteIdDicom');

    const output = tools([
        'findscu', '-c', 'PACS@arc:11112', '-M', 'MWL',
        '-m', `PatientID=${patientId}`,
        '-m', `AccessionNumber=${accessionNumber}`,
        '-m', `StudyInstanceUID=${studyInstanceUID}`,
        '-r', 'PatientName',
    ]);
    if (!output.includes(studyInstanceUID)) {
        throw new Error(`la MWL no devolvió el estudio ${studyInstanceUID}\n${output}`);
    }

    return {
        studyInstanceUID,
        accessionNumber,
        patientId,
        patientName: tag(output, '0010,0010') || 'RUP^PACIENTE',
    };
}

function enviarEstudio(estudio) {
    const ahora = new Date();
    const fecha = ahora.toISOString().slice(0, 10).replace(/-/g, '');
    const hora = ahora.toISOString().slice(11, 19).replace(/:/g, '');
    const dataset = {
        '00080005': { vr: 'CS', Value: ['ISO_IR 100'] },
        '00080008': { vr: 'CS', Value: ['ORIGINAL', 'PRIMARY'] },
        '00080016': { vr: 'UI', Value: ['1.2.840.10008.5.1.4.1.1.1'] },
        '00080018': { vr: 'UI', Value: [`${estudio.studyInstanceUID}.1`] },
        '00080020': { vr: 'DA', Value: [fecha] },
        '00080030': { vr: 'TM', Value: [hora] },
        '00080050': { vr: 'SH', Value: [estudio.accessionNumber] },
        '00080060': { vr: 'CS', Value: ['CR'] },
        '00081030': { vr: 'LO', Value: ['radiografia simple'] },
        '00100010': { vr: 'PN', Value: [{ Alphabetic: estudio.patientName }] },
        '00100020': { vr: 'LO', Value: [estudio.patientId] },
        '0020000D': { vr: 'UI', Value: [estudio.studyInstanceUID] },
        '0020000E': { vr: 'UI', Value: [`${estudio.studyInstanceUID}.2`] },
        '00200010': { vr: 'SH', Value: ['1'] },
        '00200011': { vr: 'IS', Value: ['1'] },
        '00200013': { vr: 'IS', Value: ['1'] },
        '00280002': { vr: 'US', Value: [1] },
        '00280004': { vr: 'CS', Value: ['MONOCHROME2'] },
        '00280010': { vr: 'US', Value: [16] },
        '00280011': { vr: 'US', Value: [16] },
        '00280100': { vr: 'US', Value: [8] },
        '00280101': { vr: 'US', Value: [8] },
        '00280102': { vr: 'US', Value: [7] },
        '00280103': { vr: 'US', Value: [0] },
        '7FE00010': { vr: 'OB', InlineBinary: pixelData() },
    };

    const jsonPath = path.join(os.tmpdir(), `estudio-${Date.now()}.json`);
    fs.writeFileSync(jsonPath, JSON.stringify(dataset));
    const container = docker([...composeArgs, 'ps', '-q', 'tools']).trim();
    docker(['cp', jsonPath, `${container}:/tmp/estudio.json`]);
    fs.unlinkSync(jsonPath);
    tools(['json2dcm', '-j', '/tmp/estudio.json', '-o', '/tmp/estudio.dcm']);
    tools(['storescu', '-c', 'PACS@arc:11112', '/tmp/estudio.dcm']);
    return true;
}

module.exports = { worklist, enviarEstudio };
