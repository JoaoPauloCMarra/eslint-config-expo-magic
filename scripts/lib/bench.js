function median(values) {
	const sorted = [...values].sort((a, b) => a - b);
	const middle = Math.floor(sorted.length / 2);

	return sorted.length % 2 === 0
		? (sorted[middle - 1] + sorted[middle]) / 2
		: sorted[middle];
}

// Peak resident memory in bytes from `/usr/bin/time -l` (macOS, bytes) or
// `/usr/bin/time -v` (Linux, kilobytes) output.
function parsePeakRss(timeOutput) {
	const macOS = /(\d+)\s+maximum resident set size/.exec(timeOutput);
	if (macOS) return Number(macOS[1]);

	const linux = /Maximum resident set size \(kbytes\): (\d+)/.exec(timeOutput);
	if (linux) return Number(linux[1]) * 1024;

	return null;
}

function summarize(samples) {
	const times = samples.map((sample) => sample.ms);
	const rss = samples
		.map((sample) => sample.rss)
		.filter((value) => value !== null);

	return {
		runs: samples.length,
		medianMs: median(times),
		minMs: Math.min(...times),
		maxMs: Math.max(...times),
		medianRssMb: rss.length > 0 ? median(rss) / 1024 / 1024 : null,
	};
}

module.exports = { median, parsePeakRss, summarize };
