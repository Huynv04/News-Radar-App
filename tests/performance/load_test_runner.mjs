/**
 * News Radar — Native Node.js Load & Performance Test Runner
 *
 * Cho phép chạy kiểm thử hiệu năng (50 concurrent users, latency p95, throughput)
 * ngay bằng Node.js mà KHÔNG BẮT BUỘC phải cài đặt k6 binary.
 *
 * Cách chạy:
 *   1. Khởi động backend API:
 *        dotnet run --project server/src/NewsRadar.Api
 *   2. Chạy kiểm thử hiệu năng:
 *        node tests/performance/load_test_runner.mjs
 *      (Hoặc nếu máy đã cài k6: k6 run tests/performance/load_test.js)
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:5275';

console.log('='.repeat(70));
console.log('⚡ NEWS RADAR — PERFORMANCE & LOAD TESTS (KIỂM THỬ HIỆU NĂNG)');
console.log('='.repeat(70));
console.log(`🔗 Target URL: ${BASE_URL}`);

// Hàm tính phân vị (Percentile)
function calculatePercentile(latencies, percentile) {
  if (latencies.length === 0) return 0;
  const sorted = [...latencies].sort((a, b) => a - b);
  const index = Math.ceil((percentile / 100) * sorted.length) - 1;
  return sorted[Math.max(0, index)];
}

// Hàm giả lập tải đồng thời
async function runLoadScenario({ name, url, method = 'GET', body = null, headers = {}, concurrency = 20, durationSeconds = 10, maxP95Ms = 500 }) {
  console.log(`\n🚀 [Kịch bản] ${name}`);
  console.log(`   - Số lượng người dùng đồng thời (VUs): ${concurrency}`);
  console.log(`   - Thời gian chạy tải: ${durationSeconds}s`);
  console.log(`   - Ngưỡng SLA yêu cầu: p(95) < ${maxP95Ms}ms, tỷ lệ lỗi < 1%`);

  const latencies = [];
  let successCount = 0;
  let failCount = 0;
  const startTime = Date.now();
  const endTime = startTime + durationSeconds * 1000;

  async function worker() {
    while (Date.now() < endTime) {
      const reqStart = performance.now();
      try {
        const res = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json', ...headers },
          body: body ? JSON.stringify(body) : undefined,
        });
        const reqDuration = performance.now() - reqStart;
        latencies.push(reqDuration);

        if (res.status < 500) {
          successCount++;
        } else {
          failCount++;
        }
      } catch (err) {
        failCount++;
      }
    }
  }

  // Chạy đồng thời `concurrency` workers
  const workers = Array.from({ length: concurrency }, () => worker());
  await Promise.all(workers);

  const totalTimeSec = (Date.now() - startTime) / 1000;
  const totalRequests = successCount + failCount;
  const rps = (totalRequests / totalTimeSec).toFixed(1);
  const errRate = ((failCount / Math.max(1, totalRequests)) * 100).toFixed(2);
  const p50 = calculatePercentile(latencies, 50).toFixed(1);
  const p95 = calculatePercentile(latencies, 95).toFixed(1);
  const p99 = calculatePercentile(latencies, 99).toFixed(1);
  const avg = (latencies.reduce((a, b) => a + b, 0) / Math.max(1, latencies.length)).toFixed(1);

  console.log(`\n📊 KẾT QUẢ:`);
  console.log(`   • Tổng requests: ${totalRequests} (${rps} req/sec)`);
  console.log(`   • Thành công: ${successCount} | Thất bại: ${failCount} (Tỷ lệ lỗi: ${errRate}%)`);
  console.log(`   • Độ trễ (Latency): Trung bình=${avg}ms | p(50)=${p50}ms | p(95)=${p95}ms | p(99)=${p99}ms`);

  const passedP95 = Number(p95) < maxP95Ms;
  const passedErrRate = Number(errRate) < 1.0;

  if (passedP95 && passedErrRate) {
    console.log(`   🎯 ĐÁNH GIÁ: ✅ PASSED SLA (p95: ${p95}ms < ${maxP95Ms}ms, error: ${errRate}% < 1%)`);
    return true;
  } else {
    console.log(`   🎯 ĐÁNH GIÁ: ❌ FAILED SLA (${!passedP95 ? `p95 ${p95}ms vượt ngưỡng ${maxP95Ms}ms` : ''} ${!passedErrRate ? `tỷ lệ lỗi ${errRate}% vượt 1%` : ''})`);
    return false;
  }
}

async function main() {
  // 1. Kiểm tra Server trước khi test tải
  process.stdout.write('🔍 Đang kiểm tra kết nối tới Server... ');
  try {
    const res = await fetch(`${BASE_URL}/api/articles?pageSize=1`);
    if (res.ok) {
      console.log('✅ Server đang hoạt động!\n');
    } else {
      console.log(`⚠️ Server phản hồi mã HTTP ${res.status}\n`);
    }
  } catch (e) {
    console.log('❌ OFFLINE\n');
    console.error('⚠️ Server chưa khởi động tại ' + BASE_URL);
    console.error('Hãy mở 1 terminal và chạy lệnh: dotnet run --project server/src/NewsRadar.Api trước khi test tải.\n');
    process.exit(1);
  }

  // 2. Kịch bản 1: Articles Feed API chịu tải 50 VUs (Keyset Pagination)
  const sc1 = await runLoadScenario({
    name: 'Articles API (Cursor Pagination) — 50 Users đồng thời',
    url: `${BASE_URL}/api/articles?pageSize=20`,
    concurrency: 50,
    durationSeconds: 10,
    maxP95Ms: 500,
  });

  // 3. Kịch bản 2: Auth Login API chịu tải 20 VUs (BCrypt & JWT)
  const sc2 = await runLoadScenario({
    name: 'Auth Login Stress Test — 20 Users đồng thời',
    url: `${BASE_URL}/api/auth/login`,
    method: 'POST',
    body: { email: 'loadtest@newsradar.test', password: 'LoadTest@12345' },
    concurrency: 20,
    durationSeconds: 10,
    maxP95Ms: 800,
  });

  console.log('\n' + '='.repeat(70));
  if (sc1 && sc2) {
    console.log('🏆 TOÀN BỘ KỊCH BẢN PERFORMANCE TESTS ĐÃ ĐẠT CHUẨN SLA THÀNH CÔNG!');
  } else {
    console.log('⚠️ Có kịch bản không đạt ngưỡng SLA hiệu năng. Vui lòng tối ưu hóa backend.');
  }
  console.log('='.repeat(70) + '\n');
}

main().catch(err => {
  console.error('Lỗi khi chạy performance test:', err);
});

