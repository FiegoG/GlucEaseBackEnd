// src/controllers/subscriptionController.js
const PremiumPackage = require('../models/premiumPackageModel');
const UserPremiumSubscription = require('../models/userPremiumSubscriptionModel');
const UserPremiumTransaction = require('../models/userPremiumTransactionModel');
// const UserModel = require('../models/userModel'); // Jika Anda perlu mengubah role user secara langsung

exports.getPackages = async (req, res) => {
    try {
        const packages = await PremiumPackage.getAll();
        if (!packages || packages.length === 0) {
            return res.status(404).json({ message: 'No premium packages found.' });
        }
        res.status(200).json({ message: 'Premium packages retrieved successfully', data: packages });
    } catch (error) {
        console.error('Error fetching packages:', error);
        res.status(500).json({ message: 'Failed to retrieve packages', error: error.message });
    }
};

exports.subscribePackage = async (req, res) => {
    const { userId, packageId } = req.body; // Idealnya userId dari req.user (auth token)

    if (!userId || !packageId) {
        return res.status(400).json({ message: 'User ID and Package ID are required.' });
    }

    try {
        const selectedPackage = await PremiumPackage.getById(packageId);
        if (!selectedPackage) {
            return res.status(404).json({ message: 'Premium package not found.' });
        }

        // 1. Buat transaksi (bypass)
        const transactionId = await UserPremiumTransaction.create(userId, packageId, selectedPackage.price);

        // 2. Hitung tanggal mulai dan berakhir
        const startDate = new Date();
        const endDate = new Date(startDate);
        endDate.setMonth(startDate.getMonth() + selectedPackage.duration_monts);

        // 3. Buat/Update langganan
        await UserPremiumSubscription.createSubscription(userId, packageId, transactionId, startDate, endDate);

        // 4. Update status user menjadi premium (opsional, tergantung implementasi Anda)
        // await UserPremiumSubscription.updateUserToPremium(userId); // atau UserModel.updateRole(userId, 'premium');

        res.status(200).json({
            message: 'Subscription successful! User is now premium (payment bypassed).',
            data: {
                userId,
                packageId: selectedPackage.id,
                packageName: selectedPackage.package_name,
                transactionId,
                startDate: startDate.toISOString().split('T')[0], // YYYY-MM-DD
                endDate: endDate.toISOString().split('T')[0],   // YYYY-MM-DD
            }
        });
    } catch (error) {
        console.error('Error subscribing package:', error);
        res.status(500).json({ message: 'Failed to subscribe to package', error: error.message });
    }
};

exports.cancelSubscription = async (req, res) => {
    const { userId } = req.body; // Idealnya userId dari req.user (auth token)

    if (!userId) {
        return res.status(400).json({ message: 'User ID is required.' });
    }

    try {
        const wasCancelled = await UserPremiumSubscription.cancelSubscription(userId);
        if (!wasCancelled) {
            return res.status(404).json({ message: 'No active subscription found for this user or already cancelled.' });
        }

        // await UserPremiumSubscription.revertUserToRegular(userId); // atau UserModel.updateRole(userId, 'user');

        res.status(200).json({ message: 'Subscription successfully cancelled for testing.' });
    } catch (error) {
        console.error('Error cancelling subscription:', error);
        res.status(500).json({ message: 'Failed to cancel subscription', error: error.message });
    }
};

exports.getSubscriptionStatus = async (req, res) => {
    const userId = req.params.userId; // Atau dari req.user.id

    if (!userId) {
        return res.status(400).json({ message: 'User ID is required.' });
    }
    try {
        const activeSubscription = await UserPremiumSubscription.getActiveSubscriptionByUser(userId);
        if (!activeSubscription) {
            return res.status(200).json({
                message: 'User does not have an active premium subscription.',
                isPremium: false,
                data: null
            });
        }
        res.status(200).json({
            message: 'Active subscription details retrieved.',
            isPremium: true,
            data: activeSubscription
        });
    } catch (error) {
        console.error('Error getting subscription status:', error);
        res.status(500).json({ message: 'Failed to get subscription status', error: error.message });
    }
};