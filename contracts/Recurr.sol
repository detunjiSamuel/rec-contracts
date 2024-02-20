// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

// Uncomment this line to use console.log
import "hardhat/console.sol";

contract Recurr {
    address public owner;

    struct RecurringPlan {
        address createdBy;
        uint256 amountToCharge;
        uint256 intervalPeriod;
        uint256 expirationPeriod;
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

    function createPlan(
        address _createdBy,
        uint256 _amountToCharge,
        uint256 _intervalPeriod,
        uint256 _expirationPeriod
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
            _expirationPeriod
        );

        emit planCreated(
            _createdBy,
            _amountToCharge,
            _intervalPeriod,
            _expirationPeriod
        );
    }

    function createFanSubcription(bytes32 _recurringPlan) public {
        require(
            recurringPlans[_recurringPlan].createdBy != address(0),
            "Recurring plan does not exist"
        );

        plansSubcribersCount[_recurringPlan] += 1;

        bytes32 fanSubcriptionHash = keccak256(
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
}
