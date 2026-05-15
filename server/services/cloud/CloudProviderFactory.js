const AliYunProvider = require('./providers/AliYunProvider');
const TencentCloudProvider = require('./providers/TencentCloudProvider');
const AWSProvider = require('./providers/AWSProvider');

class CloudProviderFactory {
  static getProvider(provider) {
    switch (provider.toLowerCase()) {
      case 'aliyun':
        return new AliYunProvider();
      case 'tencentcloud':
        return new TencentCloudProvider();
      case 'aws':
        return new AWSProvider();
      default:
        throw new Error(`Unknown provider: ${provider}`);
    }
  }

  static getAvailableProviders() {
    return ['aliyun', 'tencentcloud', 'aws'];
  }
}

module.exports = CloudProviderFactory;
