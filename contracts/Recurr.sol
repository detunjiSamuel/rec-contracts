// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

// Uncomment this line to use console.log
// import "hardhat/console.sol";

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract Recurr {
    address public owner;

    struct RecurringPlan {
        address createdBy;
        uint256 amountToCharge;
        uint256 intervalPeriod;
        uint256 expirationPeriod;
        address token;
        uint256 freeTrialPeriod;
    }

    struct FanSubcription {
        bytes32 recurringPlan;
        address createdBy;
        uint256 startsAt;
        bool isActive;
        uint256 lastChargedAt;
        uint256 totalPaymentMade;
    }

    mapping(bytes32 => RecurringPlan) public recurringPlans;
    mapping(bytes32 => FanSubcription) public fanSubscriptions;
    mapping(bytes32 => uint256) public plansSubcribersCount;

    constructor(address _owner) {
        owner = _owner;
    }

    event planCreated(
        address indexed _createdBy,
        uint256 _amountToCharge,
        uint256 _intervalPeriod,
        uint256 _expirationPeriod
    );

    event FanSubcriptionCreated(
        bytes32 indexed _recurringPlan,
        bytes32 indexed _fanSubcriptionHash,
        address indexed _createdBy,
        uint256 _startsAt
    );

    event FanSubcriptionEnded(
        address indexed endedBy,
        bytes32 indexed _fanSubcriptionHash
    );

    event PaymentMade(
        bytes32 indexed _fanSubcriptionHash,
        address indexed _createdBy
    );

    function createPlan(
        address _createdBy,
        uint256 _amountToCharge,
        uint256 _intervalPeriod,
        uint256 _expirationPeriod,
        address _token,
        uint256 _freeTrialPeriod
    ) public {
        bytes32 planId = keccak256(
            abi.encodePacked(
                _createdBy,
                _amountToCharge,
                _intervalPeriod,
                _expirationPeriod
            )
        );

        recurringPlans[planId] = RecurringPlan(
            _createdBy,
            _amountToCharge,
            _intervalPeriod,
            _expirationPeriod,
            _token,
            _freeTrialPeriod
        );

        emit planCreated(
            _createdBy,
            _amountToCharge,
            _intervalPeriod,
            _expirationPeriod
        );
    }

    function createFanSubcription(
        bytes32 _recurringPlan
    ) public returns (bytes32 fanSubcriptionHash) {
        RecurringPlan storage sub = recurringPlans[_recurringPlan];

        require(sub.createdBy != address(0), "Recurring plan does not exist");

        plansSubcribersCount[_recurringPlan] += 1;

        fanSubcriptionHash = keccak256(
            abi.encodePacked(
                _recurringPlan,
                plansSubcribersCount[_recurringPlan]
            )
        );

        fanSubscriptions[fanSubcriptionHash] = FanSubcription(
            _recurringPlan,
            msg.sender,
            block.timestamp,
            true,
            block.timestamp,
            0
        );

        emit FanSubcriptionCreated(
            _recurringPlan,
            fanSubcriptionHash,
            msg.sender,
            block.timestamp
        );
    }

    function stopFanSubcription(bytes32 _fanSubcriptionHash) public {
        FanSubcription storage sub = fanSubscriptions[_fanSubcriptionHash];

        require(sub.createdBy != address(0), "Subcription does not exist");

        RecurringPlan storage plan = recurringPlans[sub.recurringPlan];

        bool userCanPerformAction = sub.createdBy == msg.sender ||
            plan.createdBy == msg.sender;

        require(
            userCanPerformAction,
            "You are not the owner of this subcription"
        );

        sub.isActive = false;

        emit FanSubcriptionEnded(msg.sender, _fanSubcriptionHash);
    }

    function makePayment(bytes32 _fanSubcriptionHash) public {
        FanSubcription storage sub = fanSubscriptions[_fanSubcriptionHash];

        require(sub.createdBy != address(0), "Subcription does not exist");

        RecurringPlan storage plan = recurringPlans[sub.recurringPlan];

        require(sub.isActive, "Subcription is not active");

        require(
            block.timestamp - sub.lastChargedAt >= plan.intervalPeriod,
            "It's not time to charge yet"
        );

        sub.lastChargedAt = block.timestamp;
        sub.totalPaymentMade += 1;

        IERC20(plan.token).transferFrom(
            sub.createdBy,
            plan.createdBy,
            plan.amountToCharge
        );

        emit PaymentMade(_fanSubcriptionHash, sub.createdBy);
    }
}
