pragma solidity ^0.7.0;

contract Reward {
    event RewardClaimed(address indexed _user, uint256 _reward);

    address public owner;
    mapping(address => uint256) public balances;

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    function distribute(address[] calldata users, uint256[] calldata rewards)
        external
        payable
        onlyOwner
    {
        require(
            users.length == rewards.length,
            "Number of users and rewards is not match"
        );
        uint256 totalReward = msg.value;
        for (uint256 i = 0; i < users.length; i++) {
            balances[users[i]] += rewards[i];
            totalReward -= rewards[i];
        }
        require(
            totalReward == 0,
            "Total rewards is not match with received eth value"
        );
    }

    function claim() external {
        require(balances[msg.sender] > 0, "No reward");

        uint256 reward = balances[msg.sender];
        balances[msg.sender] = 0;
        (bool success, ) = msg.sender.call{value: reward}("");
        require(success, "Transfer failed.");
        emit RewardClaimed(msg.sender, reward);
    }

    //TODO: withdraw
    //TODO: transfer owner
    //TODO: disable claim? maybe useful when we need to migrate fund to the new one
}
